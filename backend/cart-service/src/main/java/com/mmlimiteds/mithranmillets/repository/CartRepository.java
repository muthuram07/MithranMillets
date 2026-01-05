package com.mmlimiteds.mithranmillets.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.mmlimiteds.mithranmillets.entity.CartItem;

public interface CartRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUsername(String username);
    CartItem findByUsernameAndProductId(String username, Long productId);
}
