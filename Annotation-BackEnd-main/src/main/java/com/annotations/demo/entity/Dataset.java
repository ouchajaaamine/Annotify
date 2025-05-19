package com.annotations.demo.entity;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Getter
@Setter
@EqualsAndHashCode(of = "id")
@ToString(exclude = {"tasks", "classesPossibles", "coupleTexts"})
@AllArgsConstructor
@NoArgsConstructor
public class Dataset {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String description;
    private String filePath;
    private String fileType;

    @JsonIgnore
    @OneToMany(mappedBy="dataset")
    private List<Task> tasks = new ArrayList<>();

    @JsonManagedReference
    @OneToMany(mappedBy="dataset", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ClassPossible> classesPossibles = new HashSet<>();

    @JsonIgnore
    @OneToMany(mappedBy="dataset")
    private Set<CoupleText> coupleTexts = new HashSet<>();
}
