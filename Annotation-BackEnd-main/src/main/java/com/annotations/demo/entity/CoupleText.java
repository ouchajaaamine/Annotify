package com.annotations.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@EqualsAndHashCode(of = {"text_1", "text_2", "dataset"})
@ToString(exclude = {"taches", "annotations"})
@NoArgsConstructor
@AllArgsConstructor
public class CoupleText {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "text_1", columnDefinition = "LONGTEXT")
    private String text_1;

    @Column(name = "text_2", columnDefinition = "LONGTEXT")
    private String text_2;

    @Column(name = "original_id")
    private Long originalId; // Nouveau champ pour le suivi de l'ID originale

    @JsonIgnore
    @ManyToMany(mappedBy = "couples")
    private List<Task> taches = new ArrayList<>();

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "dataset_id")
    private Dataset dataset;

    @JsonIgnore
    @OneToMany(mappedBy = "coupleText", fetch = FetchType.LAZY)
    private List<Annotation> annotations = new ArrayList<>();

    // Constructeur de copie sans héritage des relations
    public CoupleText(CoupleText couple) {
        this.text_1 = couple.getText_1();
        this.text_2 = couple.getText_2();
        this.dataset = couple.getDataset();
        this.originalId = couple.getId(); // Stocke l'ID de la paire originale
    }
}