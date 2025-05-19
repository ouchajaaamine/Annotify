package com.annotations.demo.repository;

import com.annotations.demo.entity.Role;
import com.annotations.demo.entity.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Role findByRole(RoleType role);
}
