package com.mmlimiteds.mithranmillets.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.mmlimiteds.mithranmillets.entity.Order;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // Retrieve all orders placed by a specific user
    List<Order> findByUsername(String username);
    
    Optional<Order> findByRazorpayOrderId(String razorpayOrderId);

}
