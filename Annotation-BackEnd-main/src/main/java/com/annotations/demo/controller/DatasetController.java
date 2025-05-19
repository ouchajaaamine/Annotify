package com.annotations.demo.controller;

import com.annotations.demo.entity.Annotateur;
import com.annotations.demo.entity.CoupleText;
import com.annotations.demo.entity.Dataset;
import com.annotations.demo.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN_ROLE')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Dataset Management", description = "API endpoints for dataset management operations")
public class DatasetController {

    private final DatasetServiceImpl datasetService;
    private final AnnotateurService annotateurService;
    private final CoupleTextServiceImpl coupleTextService;
    private final AsyncDatasetParserService asyncDatasetParserService;
    private final UserService userService;
    private final AssignTaskToAnnotator assignTaskToAnnotator;

    @Autowired
    public DatasetController(DatasetServiceImpl datasetService,
                             AnnotateurService annotateurService,
                             CoupleTextServiceImpl coupleTextService,
                             AsyncDatasetParserService asyncDatasetParserService,
                             UserService userService,
                             AssignTaskToAnnotator assignTaskToAnnotator) {
        this.datasetService = datasetService;
        this.annotateurService = annotateurService;
        this.coupleTextService = coupleTextService;
        this.asyncDatasetParserService = asyncDatasetParserService;
        this.userService = userService;
        this.assignTaskToAnnotator = assignTaskToAnnotator;
    }

    @GetMapping("/datasets")
    @Operation(summary = "List all datasets",
            description = "Retrieves all datasets with current user information")
    @ApiResponses(value = {
            @ApiResponse(
                responseCode = "200", 
                description = "Successfully retrieved datasets list",
                content = @Content(mediaType = "application/json", 
                    schema = @Schema(implementation = Dataset.class))
            ),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<?> getAllDatasets() {
        try {
            Map<String, Object> response = new HashMap<>();
            String currentUser = StringUtils.capitalize(userService.getCurrentUserName());
            List<Dataset> datasets = datasetService.findAllDatasets();
            
            response.put("userName", currentUser);
            response.put("datasets", datasets);
            response.put("total", datasets.size());
            
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", "Failed to fetch datasets",
                    "message", e.getMessage()
                ));
        }
    }

    @GetMapping("/datasets/details/{id}")
    @Operation(summary = "Get dataset details",
            description = "Retrieves detailed information about a specific dataset")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved dataset details"),
            @ApiResponse(responseCode = "404", description = "Dataset not found")
    })
    public ResponseEntity<?> getDatasetDetails(
            @Parameter(description = "Dataset ID") @PathVariable Long id,
            @Parameter(description = "Page number (starts from 0)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "25") int size) {

        Dataset dataset = datasetService.findDatasetById(id);
        if (dataset == null) {
            return ResponseEntity.notFound().build();
        }

        // Nettoyer les relations circulaires dans le dataset
        if (dataset.getTasks() != null) {
            dataset.getTasks().forEach(task -> {
                task.setDataset(null);
                if (task.getCouples() != null) {
                    task.getCouples().forEach(couple -> {
                        couple.setTaches(null);
                        couple.setDataset(null);
                    });
                }
            });
        }
        dataset.setCoupleTexts(null);

        // Récupérer les couples de texte avec pagination
        Page<CoupleText> coupleTextsPage = coupleTextService.getCoupleTextsByDatasetId(id, page, size);
        List<CoupleText> simplifiedCoupleTexts = coupleTextsPage.getContent().stream()
            .map(couple -> {
                CoupleText simplified = new CoupleText();
                simplified.setId(couple.getId());
                simplified.setText_1(couple.getText_1());
                simplified.setText_2(couple.getText_2());
                simplified.setOriginalId(couple.getOriginalId());
                return simplified;
            })
            .collect(Collectors.toList());

        int totalPages = coupleTextsPage.getTotalPages();
        int currentPage = page;
        int startPage = Math.max(0, currentPage - 2);
        int endPage = Math.min(totalPages - 1, currentPage + 2);

        Map<String, Object> response = new HashMap<>();
        response.put("userName", StringUtils.capitalize(userService.getCurrentUserName()));
        response.put("dataset", dataset);
        response.put("coupleTexts", simplifiedCoupleTexts);
        response.put("pagination", Map.of(
                "currentPage", currentPage,
                "totalPages", totalPages,
                "startPage", startPage,
                "endPage", endPage
        ));

        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/datasets", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
        summary = "Create a new dataset",
        description = "Upload a new dataset with an Excel file and metadata"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Dataset created successfully",
            content = @Content(schema = @Schema(implementation = Dataset.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid input data",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class))
        )
    })
    public ResponseEntity<?> createDataset(
        @Parameter(description = "Name of the dataset")
        @RequestParam String name,
        
        @Parameter(description = "Description of the dataset")
        @RequestParam String description,
        
        @Parameter(description = "Excel file containing the dataset data")
        @RequestPart(required = true) MultipartFile file,
        
        @Parameter(
            description = "Possible classes separated by semicolons (e.g. 'class1;class2;class3')",
            example = "positive;negative;neutral"
        )
        @RequestParam String classesRaw
    ) {
        try {
            Dataset dataset = datasetService.createDataset(name, description, file, classesRaw);
            return ResponseEntity.ok(dataset);
        } catch (IOException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to create dataset: " + e.getMessage()));
        }
    }

    @GetMapping("/datasets/{id}/assign_annotator")
    @Operation(summary = "Get annotator assignment data",
            description = "Retrieves data needed for annotator assignment")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Assignment data retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Dataset not found")
    })
    public ResponseEntity<?> getAssignAnnotatorData(@PathVariable Long id) {
        Dataset dataset = datasetService.findDatasetById(id);
        if (dataset == null) {
            return ResponseEntity.notFound().build();
        }

        List<Annotateur> annotateurs = annotateurService.findAllActive();
        List<Long> assignedAnnotateurIds = new ArrayList<>();
        if (dataset.getTasks() != null) {
            assignedAnnotateurIds = dataset.getTasks().stream()
                    .filter(task -> task.getAnnotateur() != null)
                    .map(task -> task.getAnnotateur().getId())
                    .toList();
        }

        Date deadlineDate = null;
        if (dataset.getTasks() != null && !dataset.getTasks().isEmpty()) {
            deadlineDate = dataset.getTasks().get(0).getDateLimite();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("userName", StringUtils.capitalize(userService.getCurrentUserName()));
        response.put("dataset", dataset);
        response.put("annotateurs", annotateurs);
        response.put("assignedAnnotateurIds", assignedAnnotateurIds);
        response.put("deadlineDate", deadlineDate);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/datasets/{id}/annotators/{annotatorId}")
    @Operation(summary = "Unassign annotator",
            description = "Removes an annotator from a dataset")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Annotator unassigned successfully"),
            @ApiResponse(responseCode = "400", description = "Failed to unassign annotator")
    })
    public ResponseEntity<?> unassignAnnotator(
            @Parameter(description = "Dataset ID") @PathVariable Long id,
            @Parameter(description = "Annotator ID") @PathVariable Long annotatorId) {
        try {
            assignTaskToAnnotator.unassignAnnotator(id, annotatorId);
            return ResponseEntity.ok(Map.of("message", "Annotator unassigned successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to unassign annotator: " + e.getMessage()));
        }
    }

    
    /**
     * Deletes a dataset by its ID.
     * 
     * @param id The ID of the dataset to delete
     * @return ResponseEntity<?> Returns:
     *         - 200 OK with success message if dataset was deleted successfully
     *         - 404 Not Found if dataset with given ID does not exist
     * @throws IllegalArgumentException if ID is null
     */
    @DeleteMapping("/datasets/{id}")
    @Operation(summary = "Delete a dataset",
            description = "Deletes a dataset by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Dataset deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Dataset not found")
    })
    public ResponseEntity<?> deleteDataset(@PathVariable Long id) {
        Dataset dataset = datasetService.findDatasetById(id);
        if (dataset == null) {
            return ResponseEntity.notFound().build();
        }

        datasetService.deleteDataset(id);
        return ResponseEntity.ok(Map.of("message", "Dataset deleted successfully"));
    }
}
