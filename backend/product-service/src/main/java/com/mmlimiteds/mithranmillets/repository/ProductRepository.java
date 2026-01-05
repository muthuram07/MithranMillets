package com.mmlimiteds.mithranmillets.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.mmlimiteds.mithranmillets.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByNameContainingIgnoreCase(String name);
    List<Product> findByCategoryIgnoreCase(String category);
    List<Product> findByNameContainingIgnoreCaseAndCategoryIgnoreCase(String name, String category);
}
