package com.annotations.demo.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "administrators")
@PrimaryKeyJoinColumn(name = "user_id")

// Using Lombok annotations consistently with other entity classes
@Getter
@Setter
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor


public class Administrator extends User {
    // No need to redefine the ID field - it's inherited from User
    // Additional Administrator-specific fields can be added here
}