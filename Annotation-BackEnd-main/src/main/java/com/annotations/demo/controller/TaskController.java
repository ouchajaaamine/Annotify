package com.annotations.demo.controller;

import com.annotations.demo.entity.Annotateur;
import com.annotations.demo.entity.Dataset;
import com.annotations.demo.entity.Task;
import com.annotations.demo.service.AnnotateurService;
import com.annotations.demo.service.AssignTaskToAnnotator;
import com.annotations.demo.service.DatasetService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

/**
 * Contrôleur gérant l'assignation des tâches aux annotateurs.
 *
 * Points de terminaison :
 * - POST /api/tasks/datasets/{id}/assign : Assigne un dataset à des annotateurs
 * - GET /api/tasks/datasets/{id}/annotators : Liste les annotateurs disponibles pour un dataset
 *
 * Tests recommandés :
 * 1. Vérifier l'assignation réussie avec au moins 3 annotateurs
 * 2. Tester la gestion des erreurs pour nombre insuffisant d'annotateurs
 * 3. Vérifier la récupération des annotateurs disponibles
 * 4. Tester avec différentes dates limites
 */
@RestController
@RequestMapping("/api/admin/tasks")
@PreAuthorize("hasRole('ADMIN_ROLE')")
@SecurityRequirement(name = "bearerAuth")
@io.swagger.v3.oas.annotations.tags.Tag(name = "Gestion des Tâches", description = "API pour la gestion et l'assignation des tâches d'annotation")
public class TaskController {

    private final DatasetService datasetService;
    private final AssignTaskToAnnotator assignTaskToAnnotator;
    private final AnnotateurService annotateurService;

    public TaskController(DatasetService datasetService, AssignTaskToAnnotator assignTaskToAnnotator, AnnotateurService annotateurService) {
        this.datasetService = datasetService;
        this.assignTaskToAnnotator = assignTaskToAnnotator;
        this.annotateurService = annotateurService;
    }


    /**
     * Assigne un dataset à une liste d'annotateurs avec une date limite.
     *
     * @param id ID du dataset à assigner
     * @param request Contient annotatorIds (List<Long>) et deadline (Date)
     * @return ResponseEntity avec le statut de l'assignation
     *
     * Test : Envoyer une requête POST à /api/tasks/datasets/{id}/assign et vérifier :
     * - L'assignation réussie avec 3+ annotateurs
     * - L'erreur pour moins de 3 annotateurs
     * - L'erreur pour dataset inexistant
     */
    @PostMapping("/datasets/{id}/assign")
    @io.swagger.v3.oas.annotations.Operation(summary = "Assigner un dataset à des annotateurs", 
        description = "Assigne un dataset à une liste d'annotateurs avec une date limite spécifiée")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Dataset assigné avec succès"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Requête invalide - nombre d'annotateurs insuffisant"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Dataset non trouvé")
    })
    public ResponseEntity<?> assignTask(
            @io.swagger.v3.oas.annotations.Parameter(description = "ID du dataset à assigner") 
            @PathVariable Long id,
            @io.swagger.v3.oas.annotations.Parameter(description = "Détails de l'assignation (annotatorIds et deadline)") 
            @RequestBody Map<String, Object> request) {

        try {
            // Conversion des IDs d'annotateurs de Integer vers Long
            List<Integer> rawIds = (List<Integer>) request.get("annotatorIds");
            List<Long> annotatorIds = rawIds.stream()
                    .map(Long::valueOf)
                    .collect(Collectors.toList());

            Date deadline = new Date((Long) request.get("deadline"));

            Dataset dataset = datasetService.findDatasetById(id);
            if (dataset == null) {
                return ResponseEntity.notFound().build();
            }

            if (annotatorIds.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Aucun annotateur sélectionné"));
            }

            if (annotatorIds.size() < 3) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Au moins 3 annotateurs actifs sont requis"));
            }

            List<Annotateur> annotateursList = annotateurService.findAllByIds(annotatorIds);
            assignTaskToAnnotator.assignTaskToAnnotator(annotateursList, dataset, deadline);
            return ResponseEntity.ok(Map.of("message", "Tâche assignée avec succès"));

        } catch (ClassCastException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Format de données invalide pour les IDs ou la date"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Récupère la liste des annotateurs assignés à un dataset.
     *
     * @param id ID du dataset
     * @return ResponseEntity contenant la liste des annotateurs assignés au dataset
     *
     * Test : Envoyer une requête GET à /api/tasks/datasets/{id}/annotators et vérifier :
     * - Le statut HTTP est 200 pour dataset existant
     * - Le statut HTTP est 404 pour dataset inexistant
     * - Seuls les annotateurs assignés au dataset sont inclus
     */
    @GetMapping("/datasets/{id}/annotators")
    @io.swagger.v3.oas.annotations.Operation(summary = "Obtenir les annotateurs assignés", 
        description = "Récupère la liste des annotateurs assignés à un dataset spécifique")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Liste des annotateurs récupérée avec succès"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Dataset non trouvé")
    })
    public ResponseEntity<List<Annotateur>> getDatasetAnnotators(
            @io.swagger.v3.oas.annotations.Parameter(description = "ID du dataset") @PathVariable Long id) {
        Dataset dataset = datasetService.findDatasetById(id);   
        if (dataset == null) {
            return ResponseEntity.notFound().build();
        }

        List<Annotateur> annotateurs = annotateurService.findAllByDataset(dataset);
        return ResponseEntity.ok(annotateurs);
    }



}
