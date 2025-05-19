package com.annotations.demo.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "annotateurs")
@PrimaryKeyJoinColumn(name = "user_id")

//ici je vais utiliser des annotations de lombok plus specifique
//car @Data ne vas pas prendre en consideration la classe parente User
@Getter
@Setter
@EqualsAndHashCode(callSuper = true)

@NoArgsConstructor
@AllArgsConstructor
public class Annotateur extends User {
    
    @OneToMany(mappedBy = "annotateur", cascade = CascadeType.ALL)
    @JsonIgnoreProperties({"annotateur", "couples"})
    private List<Task> taches = new ArrayList<>();

    @OneToMany(mappedBy="annotateur", cascade = CascadeType.ALL)
    private List<Annotation> annotations = new ArrayList<>();
}
