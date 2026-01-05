package com.mmlimiteds.mithranmillets.repository;

import com.mmlimiteds.mithranmillets.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}
