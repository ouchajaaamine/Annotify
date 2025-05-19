package com.annotations.demo.service;


import com.annotations.demo.entity.Annotation;
import com.annotations.demo.entity.CoupleText;

import java.util.*;

/**
 * Utility class for calculating inter-annotator agreement metrics
 */
public class InterAnnotatorAgreement {

    /**
     * Calculates Cohen's Kappa coefficient for two annotators
     *
     * @param annotator1Classes Classifications from first annotator
     * @param annotator2Classes Classifications from second annotator
     * @return Cohen's Kappa value between -1 and 1
     */
    public static double calculateCohensKappa(List<String> annotator1Classes, List<String> annotator2Classes) {
        if (annotator1Classes.size() != annotator2Classes.size()) {
            throw new IllegalArgumentException("Both annotators must have the same number of annotations");
        }

        // Get all unique categories
        Set<String> categories = new HashSet<>();
        categories.addAll(annotator1Classes);
        categories.addAll(annotator2Classes);

        // Create contingency matrix
        int[][] matrix = new int[categories.size()][categories.size()];
        List<String> categoryList = new ArrayList<>(categories);

        // Fill the matrix
        for (int i = 0; i < annotator1Classes.size(); i++) {
            int row = categoryList.indexOf(annotator1Classes.get(i));
            int col = categoryList.indexOf(annotator2Classes.get(i));
            matrix[row][col]++;
        }

        // Calculate observed agreement
        int totalAgreement = 0;
        for (int i = 0; i < categories.size(); i++) {
            totalAgreement += matrix[i][i];
        }
        double observedAgreement = (double) totalAgreement / annotator1Classes.size();

        // Calculate expected agreement
        double expectedAgreement = 0;
        for (int i = 0; i < categories.size(); i++) {
            // Sum of row i
            int rowSum = 0;
            for (int j = 0; j < categories.size(); j++) {
                rowSum += matrix[i][j];
            }

            // Sum of column i
            int colSum = 0;
            for (int j = 0; j < categories.size(); j++) {
                colSum += matrix[j][i];
            }

            expectedAgreement += (rowSum * colSum) / (double) (annotator1Classes.size() * annotator1Classes.size());
        }

        // Calculate Cohen's Kappa
        return (observedAgreement - expectedAgreement) / (1 - expectedAgreement);
    }

    /**
     * Calculates Fleiss' Kappa for multiple annotators
     *
     * @param annotationMatrix Each row represents an item, each column an annotator,
     *                        values are the classes assigned
     * @return Fleiss' Kappa value between -1 and 1
     */
    public static double calculateFleissKappa(String[][] annotationMatrix) {
        int numItems = annotationMatrix.length;
        int numAnnotators = annotationMatrix[0].length;

        // Get all possible categories
        Set<String> categories = new HashSet<>();
        for (String[] item : annotationMatrix) {
            for (String annotation : item) {
                if (annotation != null) {
                    categories.add(annotation);
                }
            }
        }
        List<String> categoryList = new ArrayList<>(categories);
        int numCategories = categories.size();

        // Count category assignments for each item
        int[][] categoryCountsPerItem = new int[numItems][numCategories];
        for (int i = 0; i < numItems; i++) {
            for (int j = 0; j < numAnnotators; j++) {
                if (annotationMatrix[i][j] != null) {
                    int categoryIndex = categoryList.indexOf(annotationMatrix[i][j]);
                    categoryCountsPerItem[i][categoryIndex]++;
                }
            }
        }

        // Calculate P_i (proportion of agreeing pairs for each item)
        double[] pValues = new double[numItems];
        for (int i = 0; i < numItems; i++) {
            double sum = 0;
            for (int j = 0; j < numCategories; j++) {
                sum += categoryCountsPerItem[i][j] * (categoryCountsPerItem[i][j] - 1);
            }
            pValues[i] = sum / (numAnnotators * (numAnnotators - 1));
        }

        // Calculate P (mean of all P_i values)
        double p = Arrays.stream(pValues).average().orElse(0);

        // Calculate P_e (expected agreement by chance)
        double[] pj = new double[numCategories];
        for (int j = 0; j < numCategories; j++) {
            double sum = 0;
            for (int i = 0; i < numItems; i++) {
                sum += categoryCountsPerItem[i][j];
            }
            pj[j] = sum / (numItems * numAnnotators);
        }

        double pe = Arrays.stream(pj).map(val -> val * val).sum();

        // Calculate Fleiss' Kappa
        return (p - pe) / (1 - pe);
    }

    /**
     * Calculates Krippendorff's Alpha coefficient
     *
     * @param annotations Map of item IDs to a map of annotator IDs to their classifications
     * @return Krippendorff's Alpha value between -1 and 1
     */
    public static double calculateKrippendorffsAlpha(Map<Long, Map<Long, String>> annotations) {
        // Extract all unique categories
        Set<String> categories = new HashSet<>();
        annotations.values().forEach(annotatorMap ->
                annotatorMap.values().forEach(categories::add)
        );
        List<String> categoryList = new ArrayList<>(categories);

        // Create coincidence matrix
        int[][] coincidenceMatrix = new int[categories.size()][categories.size()];

        // For each item
        for (Map<Long, String> itemAnnotations : annotations.values()) {
            // For each pair of annotators for this item
            List<String> values = new ArrayList<>(itemAnnotations.values());
            for (int i = 0; i < values.size(); i++) {
                for (int j = i + 1; j < values.size(); j++) {
                    int catI = categoryList.indexOf(values.get(i));
                    int catJ = categoryList.indexOf(values.get(j));

                    // Add to coincidence matrix symmetrically
                    coincidenceMatrix[catI][catJ]++;
                    coincidenceMatrix[catJ][catI]++;
                }
            }
        }

        // Calculate observed disagreement Do
        double totalCoincidences = 0;
        double totalDisagreements = 0;

        for (int i = 0; i < categories.size(); i++) {
            for (int j = 0; j < categories.size(); j++) {
                totalCoincidences += coincidenceMatrix[i][j];
                if (i != j) {
                    totalDisagreements += coincidenceMatrix[i][j];
                }
            }
        }

        double observedDisagreement = totalDisagreements / totalCoincidences;

        // Calculate expected disagreement De
        int[] categoryTotals = new int[categories.size()];
        for (int i = 0; i < categories.size(); i++) {
            for (int j = 0; j < categories.size(); j++) {
                categoryTotals[i] += coincidenceMatrix[i][j];
            }
        }

        double expectedDisagreement = 0;
        for (int i = 0; i < categories.size(); i++) {
            for (int j = 0; j < categories.size(); j++) {
                if (i != j) {
                    expectedDisagreement += (categoryTotals[i] * categoryTotals[j]) / totalCoincidences;
                }
            }
        }
        expectedDisagreement /= totalCoincidences - 1;

        // Calculate Krippendorff's Alpha
        return 1 - (observedDisagreement / expectedDisagreement);
    }

    /**
     * Converts annotation data to the format needed for agreement calculations
     *
     * @param annotations List of all annotations for a dataset
     * @return Structured data for agreement calculations
     */
    public static Map<Long, Map<Long, String>> structureAnnotationData(List<Annotation> annotations) {
        Map<Long, Map<Long, String>> result = new HashMap<>();

        // Group by couple ID, then by annotator ID
        for (Annotation annotation : annotations) {
            Long coupleId = annotation.getCoupleText().getId();
            Long annotateurId = annotation.getAnnotateur().getId();
            String chosenClass = annotation.getChosenClass();

            result.computeIfAbsent(coupleId, k -> new HashMap<>()).put(annotateurId, chosenClass);
        }

        return result;
    }
}