package com.annotations.demo.controller;

import com.annotations.demo.dto.UserDto;
import com.annotations.demo.entity.*;
import com.annotations.demo.repository.AnnotateurRepository;
import com.annotations.demo.repository.RoleRepository;
import com.annotations.demo.service.*;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


/**
 * Contrôleur gérant les opérations administratives.
 * Accessible uniquement aux administrateurs avec un JWT token valide.
 *
 * Points de terminaison :
 * - GET /api/admin/dashboard : Statistiques du tableau de bord
 * - GET /api/admin/annotateurs : Liste des annotateurs actifs
 * - GET /api/admin/annotateurs/add : Formulaire d'ajout d'annotateur
 * - GET /api/admin/annotateurs/{id} : Détails d'un annotateur
 * - POST /api/admin/annotateurs : Crée ou met à jour un annotateur
 * - DELETE /api/admin/annotateurs/{id} : Suppression logique d'un annotateur
 *
 * Tests recommandés :
 * 1. Vérifier l'accès restreint aux administrateurs
 * 2. Tester la création et mise à jour des annotateurs
 * 3. Vérifier la suppression logique
 * 4. Tester la récupération des statistiques
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN_ROLE')")
@SecurityRequirement(name = "bearerAuth")
@io.swagger.v3.oas.annotations.tags.Tag(name = "Administration", description = "API pour la gestion administrative (Requiert un rôle ADMIN)")
public class AdminController {
    private final UserService userService;
    private final AnnotateurService annotateurService;
    private final RoleRepository roleRepository;
    private final TaskService taskService;
    private final DatasetService datasetService;
    private final AnnotationService annotationService;
    private final TaskProgressService taskProgressService;
    private final AnnotateurRepository annotateurRepository;


    @Autowired
    public AdminController(
            UserService userService, AnnotateurService annotateurService,
            RoleRepository roleRepository, TaskService taskService, DatasetService datasetService,
                AnnotationService annotationService, TaskProgressService taskProgressService,
                AnnotateurRepository annotateurRepository) {
            this.annotateurRepository = annotateurRepository;
        this.userService = userService;
        this.annotateurService = annotateurService;
        this.roleRepository = roleRepository;
        this.taskService = taskService;
        this.datasetService = datasetService;
        this.annotationService = annotationService;
        this.taskProgressService = taskProgressService;
    }

    /**
     * Récupère les statistiques pour le tableau de bord administrateur.
     *
     * @return ResponseEntity contenant les statistiques globales
     *
     * Test : Envoyer une requête GET à /api/admin/dashboard et vérifier :
     * - Le statut HTTP est 200
     * - Les statistiques sont correctement calculées
     * - Toutes les métriques sont présentes
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN_ROLE')")
    @SecurityRequirement(name = "bearerAuth")
    @io.swagger.v3.oas.annotations.Operation(
        summary = "Obtenir les statistiques du tableau de bord", 
        description = "Récupère les statistiques globales (Requiert un rôle ADMIN)")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Statistiques récupérées avec succès")
    })
    public ResponseEntity<?> getDashboardData() {
        Map<String, Object> response = new HashMap<>();
        response.put("userName", StringUtils.capitalize(userService.getCurrentUserName()));
        response.put("totalAnnotations", annotationService.countTotalAnnotations());
        response.put("activeTasks", taskService.countActiveTasks());
        response.put("totalDatasets", datasetService.countDatasets());
        response.put("totalAnnotateurs", annotateurService.countActiveAnnotateurs());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Récupère la liste des annotateurs actifs avec leur dernière activité.
     *
     * @return ResponseEntity contenant la liste des annotateurs et leurs activités
     *
     * Test : Envoyer une requête GET à /api/admin/annotateurs et vérifier :
     * - Le statut HTTP est 200
     * - Seuls les annotateurs actifs sont inclus
     * - Les dates de dernière activité sont correctes
     */
    @GetMapping("/annotateurs")
    @PreAuthorize("hasRole('ADMIN_ROLE')")
    @SecurityRequirement(name = "bearerAuth")
    @io.swagger.v3.oas.annotations.Operation(
        summary = "Lister les annotateurs actifs", 
        description = "Récupère la liste des annotateurs actifs (Requiert un rôle ADMIN)")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Liste des annotateurs récupérée avec succès")
    })
    public ResponseEntity<?> getAnnotateurs() {
        List<Annotateur> annotateurs = annotateurRepository.findAll();
        System.out.println("Annotateurs: " + annotateurs);
       /* Map<Long, LocalDateTime> lastActivity = new HashMap<>();

        for (Annotateur annotateur : annotateurs) {
            TaskProgress latestProgress = taskProgressService.getLastAnnotationByUser(annotateur);
            lastActivity.put(annotateur.getId(), latestProgress != null ? latestProgress.getUpdatedAt() : null);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("userName", StringUtils.capitalize(userService.getCurrentUserName()));
        response.put("lastActivity", lastActivity);
        response.put("annotateurs", annotateurs);*/ 
        
        return ResponseEntity.ok(annotateurs);
    }
    


    @GetMapping("/annotateurs/{id}")
    @PreAuthorize("hasRole('ADMIN_ROLE')")
    @SecurityRequirement(name = "bearerAuth")
    @io.swagger.v3.oas.annotations.Operation(
        summary = "Obtenir les détails d'un annotateur", 
        description = "Récupère les informations d'un annotateur (Requiert un rôle ADMIN)")
    public ResponseEntity<?> getAnnotateur(@PathVariable Long id) {
        Annotateur annotateur = annotateurService.findAnnotateurById(id);
        if (annotateur == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("userName", StringUtils.capitalize(userService.getCurrentUserName()));
        response.put("user", annotateur);
        return ResponseEntity.ok(response);
    }



    /**
     * Crée ou met à jour un annotateur.
     *
     * @param user Données de l'annotateur à créer/modifier
     * @return ResponseEntity avec le statut de l'opération
     *
     * Test : Envoyer une requête POST à /api/admin/annotateurs et vérifier :
     * - La création réussie d'un nouvel annotateur
     * - La mise à jour réussie d'un annotateur existant
     * - La gestion des erreurs pour données invalides
     */
    @PostMapping("/annotateurs")
    @PreAuthorize("hasRole('ADMIN_ROLE')")
    @SecurityRequirement(name = "bearerAuth")
    @io.swagger.v3.oas.annotations.Operation(
        summary = "Créer ou mettre à jour un annotateur", 
        description = "Crée ou met à jour un annotateur (Requiert un rôle ADMIN)")
    @io.swagger.v3.oas.annotations.responses.ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Annotateur créé ou mis à jour avec succès"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Erreur dans la création/mise à jour de l'annotateur"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Annotateur non trouvé pour la mise à jour")
    })
    public ResponseEntity<?> saveAnnotateur(
            @io.swagger.v3.oas.annotations.Parameter(description = "Données de l'annotateur à créer/modifier") @RequestBody UserDto user) {
        try {
            boolean isUpdateOperation = user.getId() != null;
            
            if (!isUpdateOperation) {
                Role annotateurRole = roleRepository.findByRole(RoleType.USER_ROLE);
                if (annotateurRole == null) {
                    throw new IllegalStateException("Annotateur role not found in the database");
                }
                user.setRole(annotateurRole);
                user.setDeleted(false);
            }

            User savedUser = annotateurService.saveAnnotateur(user);
            Map<String, Object> result = new HashMap<>();
            result.put("message", isUpdateOperation ? "Annotateur updated successfully" : "Annotateur added successfully");
            result.put("user", savedUser);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error " + (user.getId() != null ? "updating" : "adding") + " annotateur: " + e.getMessage()
            ));
        }
    }





}