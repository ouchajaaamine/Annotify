package com.annotations.demo.service;

import com.annotations.demo.entity.ClassPossible;
import com.annotations.demo.entity.CoupleText;
import com.annotations.demo.entity.Dataset;
import com.annotations.demo.repository.ClassPossibleRepository;
import com.annotations.demo.repository.CoupleTextRepository;
import com.annotations.demo.repository.DatasetRepository;
import com.annotations.demo.service.DatasetService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;


@Service
public class DatasetServiceImpl implements DatasetService {

    // Changed to a constant path that exists in project structure
    private static final String UPLOAD_DIR = "uploads/datasets";

    @Autowired
    private final DatasetRepository datasetRepository;
    @Autowired
    private final ClassPossibleRepository classPossibleRepository;
    @Autowired
    private CoupleTextRepository coupleTextRepository;

    public DatasetServiceImpl(DatasetRepository datasetRepository, ClassPossibleRepository classPossibleRepository) {
        this.datasetRepository = datasetRepository;
        this.classPossibleRepository = classPossibleRepository;
    }

    @Override
    public List<Dataset> findAllDatasets() {
        List<Dataset> datasets = datasetRepository.findAll();
        // Garder uniquement les informations essentielles des tâches
        datasets.forEach(dataset -> {
            if (dataset.getTasks() != null) {
                dataset.getTasks().forEach(task -> {
                    task.setDataset(null);  // Casser la référence circulaire
                    task.setCouples(null);  // Ne pas inclure les couples de texte
                });
            }
            dataset.setCoupleTexts(null);
        });
        return datasets;
    }
    @Override
    public Dataset findDatasetByName(String name) {
        return datasetRepository.findByName(name);
    }
    @Override
    public Dataset findDatasetById(Long id) {
        return datasetRepository.findById(id).orElse(null);
    }

    @Override
    @Transactional
    public Dataset createDataset(String name, String description, MultipartFile file, String classesRaw) throws IOException {
        // Create and initialize the dataset
        final Dataset dataset = new Dataset();
        dataset.setName(name);
        dataset.setDescription(description);

        if (file != null && !file.isEmpty()) {
            // Create upload directory if it doesn't exist
            File uploadDirFile = new File(UPLOAD_DIR);
            if (!uploadDirFile.exists()) {
                uploadDirFile.mkdirs();
            }

            // Generate a unique filename to avoid collisions
            String uniqueFilename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path targetLocation = Paths.get(UPLOAD_DIR, uniqueFilename).toAbsolutePath();

            // Save the file to disk
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Set file information
            dataset.setFilePath(targetLocation.toString());
            dataset.setFileType(file.getContentType());
        }

        // Create and set classes before saving
        Set<ClassPossible> classSet = Arrays.stream(classesRaw.split(";"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(className -> {
                    ClassPossible cp = new ClassPossible();
                    cp.setTextClass(className);
                    cp.setDataset(dataset);
                    return cp;
                })
                .collect(Collectors.toSet());
        dataset.setClassesPossibles(classSet);

        // Save the dataset first
        Dataset savedDataset = datasetRepository.save(dataset);

        // Parse the dataset if a file was provided
        if (file != null && !file.isEmpty()) {
            ParseDataset(savedDataset);
            // Refresh to get the latest data including coupleTexts
            savedDataset = datasetRepository.findById(savedDataset.getId()).orElse(savedDataset);
        }

        return savedDataset;
    }

    @Override
    public void ParseDataset(Dataset dataset) {
        final int MAX_ROWS = 1000;

        String filename = dataset.getFilePath();
        if (filename == null || filename.isEmpty()) {
            throw new IllegalArgumentException("Dataset has no associated file");
        }

        // Create a Path object from the stored filepath
        Path filePath = Paths.get(filename);

        if (!Files.exists(filePath)) {
            // If the file doesn't exist at the stored path, try to resolve it as a resource
            try {
                File resourceFile = new File(filename);
                if (resourceFile.exists()) {
                    filePath = resourceFile.toPath();
                } else {
                    throw new RuntimeException("File not found: " + filePath.toString());
                }
            } catch (Exception e) {
                throw new RuntimeException("File not found: " + filePath.toString(), e);
            }
        }

        try (InputStream fileInputStream = new FileInputStream(filePath.toFile());
             Workbook workbook = WorkbookFactory.create(fileInputStream)) {

            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();

            int rowCount = 0;
            Set<CoupleText> coupleTexts = new HashSet<>();

            // Skip header
            if (rowIterator.hasNext()) rowIterator.next();

            while (rowIterator.hasNext() && rowCount < MAX_ROWS) {
                Row row = rowIterator.next();
                Cell text1Cell = row.getCell(0);
                Cell text2Cell = row.getCell(1);

                if (text1Cell == null || text2Cell == null) continue;

                String text1 = text1Cell.getStringCellValue().trim();
                String text2 = text2Cell.getStringCellValue().trim();

                CoupleText couple = new CoupleText();
                couple.setText_1(text1);
                couple.setText_2(text2);
                couple.setDataset(dataset);

                coupleTexts.add(couple);
                rowCount++;
            }

            // Save all couples and attach them to the dataset
            coupleTextRepository.saveAll(coupleTexts);

        } catch (IOException e) {
            throw new RuntimeException("Error reading Excel file", e);
        }
    }

    @Override
    public void SaveDataset(Dataset dataset) {
        datasetRepository.save(dataset);
    }

    @Override
    @Transactional
    public void deleteDataset(Long id) {
        Dataset dataset = datasetRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Dataset not found with id: " + id));

        // Supprimer les tâches associées
        if (dataset.getTasks() != null) {
            dataset.getTasks().clear();
        }

        // Supprimer les couples de texte associés
        if (dataset.getCoupleTexts() != null) {
            coupleTextRepository.deleteAll(dataset.getCoupleTexts());
            dataset.getCoupleTexts().clear();
        }

        // Les classes possibles seront supprimées automatiquement grâce à CascadeType.ALL

        // Supprimer le fichier physique s'il existe
        if (dataset.getFilePath() != null) {
            try {
                Files.deleteIfExists(Paths.get(dataset.getFilePath()));
            } catch (IOException e) {
                // Log l'erreur mais continue la suppression
                System.err.println("Error deleting file: " + dataset.getFilePath());
            }
        }

        // Supprimer le dataset
        datasetRepository.delete(dataset);
    }

    @Override
    public long countDatasets() {
        return datasetRepository.count();
    }

}