package com.annotations.demo.service;


import com.annotations.demo.entity.Annotateur;
import com.annotations.demo.entity.CoupleText;
import com.annotations.demo.entity.Dataset;
import com.annotations.demo.entity.Task;
import com.annotations.demo.repository.DatasetRepository;
import com.annotations.demo.repository.TaskRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.*;


@Service
@Transactional
public class AssignTaskToAnnotator {

    private final CoupleTextServiceImpl coupleTextServiceImpl;
    private final TaskRepository taskRepository;

    public AssignTaskToAnnotator(CoupleTextServiceImpl coupleTextServiceImpl, TaskRepository taskeRepository) {
        this.coupleTextServiceImpl = coupleTextServiceImpl;
        this.taskRepository = taskeRepository;
    }




    public void assignTaskToAnnotator(List<Annotateur> annotateurList, Dataset dataset, Date deadline) {
        // Récupération des paires de texte du dataset
        Long datasetId = dataset.getId();
        List<CoupleText> coupleTextList = coupleTextServiceImpl.findAllCoupleTextsByDatasetId(datasetId);

        // Mélanger les paires pour une distribution aléatoire
        Collections.shuffle(coupleTextList);

        // Étape 1 : Assignation round-robin aux annotateurs
        int annotatorCount = annotateurList.size();
        Map<Annotateur, List<CoupleText>> taskMap = new HashMap<>();

        // Initialisation des listes de tâches
        for (Annotateur a : annotateurList) {
            taskMap.put(a, new ArrayList<>());
        }

        // Distribution round-robin
        for (int i = 0; i < coupleTextList.size(); i++) {
            Annotateur annotator = annotateurList.get(i % annotatorCount);
            CoupleText pair = coupleTextList.get(i);
            taskMap.get(annotator).add(pair);
        }

        // Étape 2 : Création des tâches dans la base de données
        for (Map.Entry<Annotateur, List<CoupleText>> entry : taskMap.entrySet()) {
            Annotateur annotator = entry.getKey();
            List<CoupleText> tasks = entry.getValue();

            if (!tasks.isEmpty()) {
                Task task = new Task();
                task.setCouples(tasks);
                task.setAnnotateur(annotator);
                task.setDataset(dataset);
                task.setDateLimite(deadline);
                taskRepository.save(task);
            }
        }
    }

    // Méthode utilitaire pour éviter la répétition d'une paire originale pour un annotateur
    private boolean hasAnnotatorAlreadyReceivedOriginalPair(Annotateur annotator, CoupleText duplicatedPair, List<CoupleText> originalPairs) {
        // Recherche de la paire originale correspondante
        return originalPairs.stream()
                .anyMatch(original -> original.getId().equals(duplicatedPair.getOriginalId())) &&
                annotator.getTaches().stream()
                        .flatMap(t -> t.getCouples().stream())
                        .anyMatch(c -> c.getOriginalId().equals(duplicatedPair.getOriginalId()));
    }

    public void unassignAnnotator(Long datasetId, Long annotatorId) {
        List<Task> tasks = taskRepository.findByDatasetIdAndAnnotateurId(datasetId, annotatorId);

        if (tasks.isEmpty()) {
            throw new IllegalArgumentException("No task found for this annotator and dataset.");
        }
        for (Task task : tasks) {
            task.setAnnotateur(null);
            taskRepository.save(task);
        }
    }

}
