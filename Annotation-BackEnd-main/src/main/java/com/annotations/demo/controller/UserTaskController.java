package com.annotations.demo.controller;

import com.annotations.demo.entity.*;
import com.annotations.demo.service.*;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.*;

/**
 * Contrôleur gérant les tâches des utilisateurs (annotateurs).
 *
 * Points de terminaison :
 * - GET /api/user/tasks : Liste les tâches de l'utilisateur connecté
 * - GET /api/user/tasks/{id} : Détails d'une tâche spécifique
 * - POST /api/user/tasks/{taskId}/annotate : Soumet une annotation
 * - GET /api/user/history : Historique des annotations de l'utilisateur
 *
 * Tests recommandés :
 * 1. Vérifier l'accès aux tâches pour utilisateur authentifié
 * 2. Tester la soumission d'annotations
 * 3. Vérifier la progression des tâches
 * 4. Tester l'historique des annotations
 */
@RestController
@RequestMapping("/api/user")
@io.swagger.v3.oas.annotations.tags.Tag(name = "Tâches Utilisateur", description = "API pour la gestion des tâches d'annotation des utilisateurs")
public class UserTaskController {
    private final AnnotateurService annotateurService;
    private final TaskService taskService;
    private final UserService userService;
    private final TaskProgressServiceImpl taskProgressService;
    private final AnnotationServiceImpl annotationService;
    public UserTaskController(AnnotateurService annotateurService, TaskService taskService, UserService userService, TaskProgressServiceImpl taskProgressService, AnnotationServiceImpl annotationService) {
        this.annotateurService = annotateurService;
        this.taskService = taskService;
        this.userService = userService;
        this.taskProgressService = taskProgressService;
        this.annotationService = annotationService;
    }

    /**
     * Récupère la liste des tâches de l'utilisateur connecté avec leur progression.
     *
     * @return ResponseEntity contenant la liste des tâches et leur progression
     *
     * Test : Envoyer une requête GET à /api/user/tasks et vérifier :
     * - Le statut HTTP est 200 pour utilisateur authentifié
     * - Le statut HTTP est 401 pour utilisateur non authentifié
     * - La progression est correctement calculée
     */
    @GetMapping("/tasks")
    @io.swagger.v3.oas.annotations.Operation(summary = "Lister les tâches de l'utilisateur",
            description = "Récupère la liste des tâches de l'utilisateur connecté avec leur progression")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Liste des tâches récupérée avec succès"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Utilisateur non authentifié")
    })
    public ResponseEntity<?> getUserTasks() {
        User annotateur = userService.getCurrentAnnotateur();
        if (annotateur == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not authenticated"));
        }

        List<Task> tasks = taskService.findAllTasksByAnnotateurId(annotateur.getId());
        Map<Long, Float> taskProgressMap = new HashMap<>();

        for (Task task : tasks) {
            Optional<TaskProgress> progressOpt = taskProgressService.getProgressForUserAndTask(annotateur, task.getId());
            taskProgressMap.put(task.getId(), Float.valueOf(progressOpt.map(TaskProgress::getLastIndex).orElse(0)));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("tasks", tasks);
        response.put("taskProgressMap", taskProgressMap);
        response.put("userName", StringUtils.capitalize(userService.getCurrentUserName()));
        return ResponseEntity.ok(response);
    }

    /**
     * Display the task detail with the current couple to annotate
     */
    /**
     * Récupère les détails d'une tâche avec le couple de textes à annoter.
     *
     * @param id ID de la tâche
     * @param index Index du couple de textes à afficher
     * @return ResponseEntity contenant les détails de la tâche et le couple courant
     *
     * Test : Envoyer une requête GET à /api/user/tasks/{id} et vérifier :
     * - L'accès autorisé pour l'annotateur assigné
     * - L'accès refusé pour autres utilisateurs
     * - La gestion correcte de l'index
     */
    @GetMapping("/tasks/{id}")
    @io.swagger.v3.oas.annotations.Operation(summary = "Obtenir les détails d'une tâche",
            description = "Récupère les détails d'une tâche avec le couple de textes à annoter")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Détails de la tâche récupérés avec succès"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Accès non autorisé à cette tâche"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Tâche non trouvée")
    })
    public ResponseEntity<?> getTaskDetail(
            @io.swagger.v3.oas.annotations.Parameter(description = "ID de la tâche") @PathVariable Long id,
            @io.swagger.v3.oas.annotations.Parameter(description = "Index du couple de textes à afficher") @RequestParam(required = false, defaultValue = "0") Integer index) {
        User annotateur = userService.getCurrentAnnotateur();
        if (annotateur == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not authenticated"));
        }

        Task task = taskService.findTaskById(id);
        if (!task.getAnnotateur().getId().equals(annotateur.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Not authorized to view this task"));
        }

        List<CoupleText> couples = new ArrayList<>(task.getCouples());
        int totalCouples = couples.size();

        if (index < 0) {
            index = 0;
        } else if (index >= totalCouples) {
            index = totalCouples - 1;
        }
        if (index == null || index == 0) {
            Optional<TaskProgress> progressOpt = taskProgressService.getProgressForUserAndTask(annotateur, id);
            if (progressOpt.isPresent()) {
                index = progressOpt.get().getLastIndex();
            }
        }

        CoupleText currentCouple = !couples.isEmpty() ? couples.get(index) : null;
        String selectedClassId = currentCouple != null ?
                taskService.getSelectedClassId(task.getId(), currentCouple.getId(), annotateur.getId()) : null;

        Map<String, Object> response = new HashMap<>();
        response.put("task", task);
        response.put("currentCouple", currentCouple);
        response.put("currentIndex", index);
        response.put("totalCouples", totalCouples);
        response.put("selectedClassId", selectedClassId);
        response.put("userName", StringUtils.capitalize(userService.getCurrentUserName()));

        return ResponseEntity.ok(response);
    }

    /**
     * Handle the annotation submission
     */
    /**
     * Soumet une annotation pour un couple de textes.
     *
     * @param taskId ID de la tâche
     * @param request Contient coupleId, classSelection, notes et currentIndex
     * @return ResponseEntity avec le statut de l'annotation et l'index suivant
     *
     * Test : Envoyer une requête POST à /api/user/tasks/{taskId}/annotate et vérifier :
     * - La sauvegarde réussie de l'annotation
     * - La mise à jour de la progression
     * - La détection de fin de tâche
     */
    @PostMapping("/tasks/{taskId}/annotate")
    @io.swagger.v3.oas.annotations.Operation(summary = "Soumettre une annotation",
            description = "Soumet une annotation pour un couple de textes dans une tâche")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Annotation sauvegardée avec succès"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Utilisateur non authentifié")
    })
    public ResponseEntity<?> annotateCouple(
            @io.swagger.v3.oas.annotations.Parameter(description = "ID de la tâche") @PathVariable Long taskId,
            @io.swagger.v3.oas.annotations.Parameter(description = "Détails de l'annotation (coupleId, classSelection, notes, currentIndex)") @RequestBody Map<String, Object> request) {

        User annotateur = userService.getCurrentAnnotateur();
        if (annotateur == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not authenticated"));
        }

        Long coupleId = Long.parseLong(request.get("coupleId").toString());
        String classSelection = (String) request.get("classSelection");
        String notes = (String) request.get("notes");
        Integer currentIndex = (Integer) request.get("currentIndex");

        annotationService.saveAnnotation(classSelection, coupleId, annotateur.getId());

        int nextIndex = currentIndex + 1;
        taskProgressService.saveOrUpdateProgress(annotateur, taskId, nextIndex);

        Task task = taskService.findTaskById(taskId);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Annotation saved successfully");
        response.put("nextIndex", nextIndex);

        if (task != null && nextIndex >= task.getCouples().size()) {
            response.put("completed", true);
            response.put("completionMessage", "Congratulations! You have completed all annotations for this task.");
        }

        return ResponseEntity.ok(response);
    }



    /**
     * Récupère l'historique des annotations de l'utilisateur.
     *
     * @return ResponseEntity contenant la liste des annotations
     *
     * Test : Envoyer une requête GET à /api/user/history et vérifier :
     * - Le statut HTTP est 200 pour utilisateur authentifié
     * - Le statut HTTP est 401 pour utilisateur non authentifié
     * - Les annotations sont triées correctement
     */
    @GetMapping("/history")
    @io.swagger.v3.oas.annotations.Operation(summary = "Obtenir l'historique des annotations",
            description = "Récupère l'historique des annotations de l'utilisateur")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Historique récupéré avec succès"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Utilisateur non authentifié")
    })
    public ResponseEntity<?> getUserHistory() {
        User annotateur = userService.getCurrentAnnotateur();
        if (annotateur == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not authenticated"));
        }

        List<Annotation> annotations = annotationService.findAllAnnotationsByUser(annotateur);
        Map<String, Object> response = new HashMap<>();
        response.put("annotations", annotations);
        response.put("userName", StringUtils.capitalize(userService.getCurrentUserName()));
        return ResponseEntity.ok(response);
    }


    @GetMapping("/tasks/{taskId}/classes")
    @io.swagger.v3.oas.annotations.Operation(summary = "Obtenir les classes d'annotation",
            description = "Récupère les classes d'annotation pour une tâche spécifique")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Classes récupérées avec succès"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Utilisateur non authentifié"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Tâche non trouvée")
    })
    public ResponseEntity<?> getAnnotationClasses(
            @io.swagger.v3.oas.annotations.Parameter(description = "ID de la tâche") @PathVariable Long taskId) {
        User annotateur = userService.getCurrentAnnotateur();
        if (annotateur == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not authenticated"));
        }

        Task task = taskService.findTaskById(taskId);
        if (task == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Task not found"));
        }

        // Récupérer le dataset associé à la tâche
        Dataset dataset = task.getDataset();
        if (dataset == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Dataset not found for this task"));
        }

        // Récupérer les classes possibles du dataset et convertir en List
        List<ClassPossible> classes = new ArrayList<>(dataset.getClassesPossibles());

        Map<String, Object> response = new HashMap<>();
        response.put("classes", classes);
        response.put("taskId", taskId);
        response.put("datasetId", dataset.getId());

        return ResponseEntity.ok(response);
    }

}
