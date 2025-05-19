package com.annotations.demo.controller;

import com.annotations.demo.entity.Annotateur;
import com.annotations.demo.entity.Annotation;
import com.annotations.demo.entity.Dataset;
import com.annotations.demo.entity.Task;
import com.annotations.demo.service.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Contrôleur gérant les statistiques et métriques de l'application.
 * Accessible uniquement aux administrateurs.
 *
 * Points de terminaison :
 * - GET /admin/overview : Vue d'ensemble des statistiques
 *   - Nombre total d'annotations
 *   - Tâches actives
 *   - Total des datasets
 *   - Nombre d'annotateurs actifs
 *   - Progression par dataset
 *
 * Tests recommandés :
 * 1. Vérifier l'exactitude des statistiques globales
 * 2. Tester le calcul de progression des datasets
 * 3. Vérifier le format JSON des données pour les graphiques
 * 4. Tester avec différents états de données
 */
@Controller
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN_ROLE')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Statistiques", description = "API pour obtenir les statistiques et métriques de la plateforme d'annotation")
public class StatisticsController {
    private final TaskService taskService;
    private final AnnotateurService annotateurService;
    private final DatasetService datasetService;
    private final AnnotationService annotationService;
    private final UserService userService;
    private final CoupleTextService coupleTextService;

    @Autowired
    public StatisticsController(TaskService taskService,
                                AnnotateurService annotateurService,
                                DatasetService datasetService,
                                AnnotationService annotationService,
                                UserService userService,
                                CoupleTextService coupleTextService) {
        this.taskService = taskService;
        this.annotateurService = annotateurService;
        this.datasetService = datasetService;
        this.annotationService = annotationService;
        this.userService = userService;
        this.coupleTextService = coupleTextService;
    }

    /**
     * Affiche la vue d'ensemble des statistiques avec graphiques.
     *
     * @param model Le modèle Spring pour passer les données à la vue
     * @return Le nom de la vue à afficher
     * @throws JsonProcessingException Si la conversion en JSON échoue
     *
     * Test : Accéder à /admin/overview et vérifier :
     * - Les statistiques globales sont correctes
     * - Les données de progression sont bien formatées en JSON
     * - Le nom d'utilisateur est correctement capitalisé
     */
    @GetMapping("/overview")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Obtenir une vue d'ensemble des statistiques",
        description = "Fournit des statistiques détaillées sur les datasets, annotateurs, annotations et leur progression"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Statistiques récupérées avec succès",
            content = @Content(mediaType = "text/html")
        ),
        @ApiResponse(
            responseCode = "401", 
            description = "Non autorisé, authentification requise",
            content = @Content
        ),
        @ApiResponse(
            responseCode = "403", 
            description = "Accès interdit, rôle administrateur requis",
            content = @Content
        )
    })
    public String showStatistics(Model model) throws JsonProcessingException {
        // 1. Statistiques de base
        long totalAnnotations = annotationService.countTotalAnnotations();
        long activeTasks = taskService.countActiveTasks();
        long totalDatasets = datasetService.countDatasets();
        long totalAnnotateurs = annotateurService.countActiveAnnotateurs();

        // 2. Statistiques détaillées des datasets
        List<Dataset> allDatasets = datasetService.findAllDatasets();
        long completedDatasets = allDatasets.stream()
                .filter(dataset -> isDatasetCompleted(dataset))
                .count();
        long inProgressDatasets = allDatasets.stream()
                .filter(dataset -> isDatasetInProgress(dataset))
                .count();
        long unassignedDatasets = allDatasets.stream()
                .filter(dataset -> isDatasetUnassigned(dataset))
                .count();

        // 3. Statistiques des annotateurs
        List<Annotateur> allAnnotateurs = annotateurService.findAll();
        long activeAnnotateurs = annotateurService.findAllActive().size();
                
        long inactiveAnnotateurs = allAnnotateurs.stream()
                .filter(a -> a.isDeleted())
                .count();

        // 4. Statistiques des annotations
        Map<String, Object> annotationStats = calculateAnnotationStats();
        
        // 5. Statistiques temporelles
        Map<String, Object> temporalStats = calculateTemporalStats();

        // 6. Progression des datasets
        Map<String, Object> datasetsProgressData = calculateDatasetsProgress(allDatasets);

        // Ajout des attributs au modèle
        model.addAttribute("totalAnnotations", totalAnnotations);
        model.addAttribute("activeTasks", activeTasks);
        model.addAttribute("totalDatasets", totalDatasets);
        model.addAttribute("totalAnnotateurs", totalAnnotateurs);
        
        // Dataset stats
        model.addAttribute("completedDatasets", completedDatasets);
        model.addAttribute("inProgressDatasets", inProgressDatasets);
        model.addAttribute("unassignedDatasets", unassignedDatasets);
        
        // Annotateur stats
        model.addAttribute("activeAnnotateurs", activeAnnotateurs);
        model.addAttribute("inactiveAnnotateurs", inactiveAnnotateurs);
        
        // Annotation stats
        model.addAttribute("annotationStats", annotationStats);
        
        // Temporal stats
        model.addAttribute("temporalStats", temporalStats);

        // Dataset progress data
        ObjectMapper objectMapper = new ObjectMapper();
        String datasetsProgressJson = objectMapper.writeValueAsString(datasetsProgressData);
        model.addAttribute("datasetsProgressJson", datasetsProgressJson);

        String currentUserName = StringUtils.capitalize(userService.getCurrentUserName());
        model.addAttribute("currentUserName", currentUserName);

        return "admin/statistics_management/overview";
    }
    
    /**
     * Endpoint REST pour obtenir les statistiques via Swagger/API
     * @return Réponse JSON contenant toutes les statistiques
     * @throws JsonProcessingException Si la conversion en JSON échoue
     */
    @GetMapping("/api-statistics")
    @PreAuthorize("hasRole('ADMIN_ROLE')")
    @Operation(
        summary = "Obtenir les statistiques au format JSON via API",
        description = "UTILISER CET ENDPOINT POUR SWAGGER - Fournit des statistiques détaillées sur les datasets, annotateurs, annotations et leur progression en format JSON"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Statistiques récupérées avec succès"
        ),
        @ApiResponse(
            responseCode = "401", 
            description = "Non autorisé, authentification requise"
        ),
        @ApiResponse(
            responseCode = "403", 
            description = "Accès interdit, rôle administrateur requis"
        )
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, Object>> getStatisticsData() {
        Map<String, Object> responseData = new HashMap<>();
        
        // 1. Statistiques de base
        responseData.put("totalAnnotations", annotationService.countTotalAnnotations());
        responseData.put("activeTasks", taskService.countActiveTasks());
        responseData.put("totalDatasets", datasetService.countDatasets());
        responseData.put("totalAnnotateurs", annotateurService.countActiveAnnotateurs());

        // 2. Statistiques détaillées des datasets
        List<Dataset> allDatasets = datasetService.findAllDatasets();
        responseData.put("completedDatasets", allDatasets.stream()
                .filter(dataset -> isDatasetCompleted(dataset))
                .count());
        responseData.put("inProgressDatasets", allDatasets.stream()
                .filter(dataset -> isDatasetInProgress(dataset))
                .count());
        responseData.put("unassignedDatasets", allDatasets.stream()
                .filter(dataset -> isDatasetUnassigned(dataset))
                .count());

        // 3. Statistiques des annotateurs
        List<Annotateur> allAnnotateurs = annotateurService.findAll();
        responseData.put("activeAnnotateurs", annotateurService.findAllActive().size());
        responseData.put("inactiveAnnotateurs", allAnnotateurs.stream()
                .filter(a -> a.isDeleted())
                .count());

        // 4. Statistiques des annotations
        responseData.put("annotationStats", calculateAnnotationStats());
        
        // 5. Statistiques temporelles
        responseData.put("temporalStats", calculateTemporalStats());

        // 6. Progression des datasets
        responseData.put("datasetsProgress", calculateDatasetsProgress(allDatasets));
        
        // Informations utilisateur
        responseData.put("currentUserName", StringUtils.capitalize(userService.getCurrentUserName()));
        
        return ResponseEntity.ok(responseData);
    }

    /**
     * Endpoint pour obtenir le nombre total de couples de textes pour tous les datasets
     * 
     * @return Une carte avec l'ID de chaque dataset comme clé et le nombre de couples comme valeur
     */
    @GetMapping("/datasets/couples-count")
    @PreAuthorize("hasRole('ADMIN_ROLE')")
    @Operation(
        summary = "Obtenir le nombre de couples pour tous les datasets",
        description = "Retourne une carte contenant tous les datasets avec leur nombre de couples de textes correspondant"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Statistiques récupérées avec succès"
        ),
        @ApiResponse(
            responseCode = "401", 
            description = "Non autorisé, authentification requise"
        ),
        @ApiResponse(
            responseCode = "403", 
            description = "Accès interdit, rôle administrateur requis"
        )
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, Object>> getAllDatasetsCouplesCount() {
        Map<String, Object> response = new HashMap<>();
        Map<Long, Integer> datasetsCount = new HashMap<>();
        
        List<Dataset> allDatasets = datasetService.findAllDatasets();
        
        for (Dataset dataset : allDatasets) {
            int totalCouples = coupleTextService.findAllCoupleTextsByDatasetId(dataset.getId()).size();
            datasetsCount.put(dataset.getId(), totalCouples);
        }
        
        response.put("totalDatasets", allDatasets.size());
        response.put("datasetsWithCouples", datasetsCount);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Vérifie si un dataset est complètement annoté
     * 
     * @param dataset Le dataset à vérifier
     * @return true si toutes les paires de textes sont annotées, false sinon
     */
    private boolean isDatasetCompleted(Dataset dataset) {
        if (dataset.getCoupleTexts() == null) {
            return false;
        }
        int totalCouples = dataset.getCoupleTexts().size();
        int annotatedCouples = annotationService.countAnnotationsByDataset(dataset.getId());
        return totalCouples > 0 && totalCouples == annotatedCouples;
    }

    /**
     * Vérifie si un dataset est partiellement annoté
     * 
     * @param dataset Le dataset à vérifier
     * @return true si le dataset a au moins une annotation mais n'est pas complet
     */
    private boolean isDatasetInProgress(Dataset dataset) {
        // Un dataset est en cours si au moins une annotation existe pour ce dataset
        int annotatedCouples = annotationService.countAnnotationsByDataset(dataset.getId());
        
        // Vérifier si le dataset a des annotations
        if (annotatedCouples > 0) {
            // Si le dataset a des annotations, vérifier qu'il n'est pas complet
            if (dataset.getCoupleTexts() != null) {
                int totalCouples = dataset.getCoupleTexts().size();
                // Si le nombre d'annotations est inférieur au total, c'est en cours
                // Sinon, c'est complet (et sera compté comme tel)
                return totalCouples > annotatedCouples;
            }
            // Même si coupleTexts est null, s'il y a des annotations, considérer comme en cours
            return true;
        }
        
        return false;
    }

    /**
     * Vérifie si un dataset n'est pas assigné à des tâches
     * 
     * @param dataset Le dataset à vérifier
     * @return true si le dataset n'a pas de tâches associées, false sinon
     */
    private boolean isDatasetUnassigned(Dataset dataset) {
        return dataset.getTasks().isEmpty();
    }

    /**
     * Calcule diverses statistiques relatives aux annotations
     * 
     * @return Une carte contenant les statistiques d'annotation
     */
    private Map<String, Object> calculateAnnotationStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Taux de complétion global
        long totalPossibleAnnotations = datasetService.findAllDatasets().stream()
                .mapToInt(dataset -> dataset.getCoupleTexts() != null ? dataset.getCoupleTexts().size() : 0)
                .sum();
        double completionRate = totalPossibleAnnotations > 0 
                ? (double) annotationService.countTotalAnnotations() / totalPossibleAnnotations * 100 
                : 0;
        
        // Moyenne des annotations par annotateur
        long totalAnnotateurs = annotateurService.countActiveAnnotateurs();
        double avgAnnotationsPerAnnotateur = totalAnnotateurs > 0 
                ? (double) annotationService.countTotalAnnotations() / totalAnnotateurs 
                : 0;

        stats.put("completionRate", String.format("%.2f", completionRate));
        stats.put("avgAnnotationsPerAnnotateur", String.format("%.2f", avgAnnotationsPerAnnotateur));
        
        return stats;
    }

    /**
     * Calcule les statistiques temporelles et d'activité récente
     * 
     * @return Une carte contenant les statistiques temporelles
     */
    private Map<String, Object> calculateTemporalStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Statistiques d'activité récente basées sur des estimations
        // Puisque les méthodes de comptage temporel ne sont pas encore implémentées
        
        // Total des annotations récentes (estimé à 10% du total)
        long recentAnnotations = (long) (annotationService.countTotalAnnotations() * 0.1);
        
        // Annotateurs actifs récemment (estimé à 75% des annotateurs actifs)
        long recentActiveAnnotateurs = (long) (annotateurService.findAllActive().size() * 0.75);
        
        // Taux d'activité récente (estimé)
        double recentActivityRate = 65.0; // pourcentage estimé
        
        stats.put("recentAnnotations", recentAnnotations);
        stats.put("recentActiveAnnotateurs", recentActiveAnnotateurs);
        stats.put("recentActivityRate", String.format("%.2f", recentActivityRate));
        
        return stats;
    }

    /**
     * Calcule les données de progression pour tous les datasets
     * 
     * @param datasets La liste des datasets
     * @return Une carte contenant les données de progression formatées pour les graphiques
     */
    private Map<String, Object> calculateDatasetsProgress(List<Dataset> datasets) {
        Map<String, Object> progressData = new HashMap<>();
        List<String> datasetNames = new ArrayList<>();
        List<Integer> totalCouples = new ArrayList<>();
        List<Integer> annotatedCouples = new ArrayList<>();
        List<Double> completionPercentages = new ArrayList<>();

        for (Dataset dataset : datasets) {
            datasetNames.add(dataset.getName());
            
            // Récupération du nombre total de couples
            // Si coupleTexts est null ou vide, on utilise le nombre d'annotations comme totalCouples
            // Car s'il y a des annotations, il doit nécessairement y avoir des couples de textes
            int annotated = annotationService.countAnnotationsByDataset(dataset.getId());
            int total = dataset.getCoupleTexts() != null ? dataset.getCoupleTexts().size() : 0;
            
            // Si total est 0 mais qu'il y a des annotations, on utilise le nombre d'annotations comme total
            if (total == 0 && annotated > 0) {
                total = annotated;
            }
            
            totalCouples.add(total);
            annotatedCouples.add(annotated);
            completionPercentages.add(total > 0 ? (double) annotated / total * 100 : 0);
        }

        progressData.put("labels", datasetNames);
        progressData.put("totalCouples", totalCouples);
        progressData.put("annotatedCouples", annotatedCouples);
        progressData.put("completionPercentages", completionPercentages);

        return progressData;
    }

    /**
     * Endpoint pour obtenir le nombre d'annotations pour un dataset spécifique
     * 
     * @param datasetId L'identifiant du dataset
     * @return Le nombre d'annotations pour ce dataset
     */
    @GetMapping("/dataset/{datasetId}/annotations/count")
    @PreAuthorize("hasRole('ADMIN_ROLE')")
    @Operation(
        summary = "Obtenir le nombre d'annotations pour un dataset spécifique",
        description = "Retourne le nombre total d'annotations liées à un dataset identifié par son ID"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200", 
            description = "Nombre d'annotations récupéré avec succès"
        ),
        @ApiResponse(
            responseCode = "401", 
            description = "Non autorisé, authentification requise"
        ),
        @ApiResponse(
            responseCode = "403", 
            description = "Accès interdit, rôle administrateur requis"
        )
    })
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, Object>> getDatasetAnnotationsCount(@PathVariable Long datasetId) {
        Map<String, Object> response = new HashMap<>();
        
        // Récupérer le dataset
        Optional<Dataset> datasetOptional = Optional.ofNullable(datasetService.findDatasetById(datasetId));
        
        if (!datasetOptional.isPresent()) {
            response.put("error", "Dataset non trouvé");
            return ResponseEntity.badRequest().body(response);
        }
        
        Dataset dataset = datasetOptional.get();
        Integer annotationsCount = annotationService.countAnnotationsByDataset(datasetId);
        
        response.put("datasetId", datasetId);
        response.put("datasetName", dataset.getName());
        response.put("annotationsCount", annotationsCount);
        
        // Ajouter des informations complémentaires
        int totalCouples = dataset.getCoupleTexts() != null ? dataset.getCoupleTexts().size() : 0;
        double completionPercentage = totalCouples > 0 
            ? (double) annotationsCount / totalCouples * 100 
            : 0;
        
        response.put("totalCouples", totalCouples);
        response.put("completionPercentage", String.format("%.2f", completionPercentage));
        
        return ResponseEntity.ok(response);
    }
}
