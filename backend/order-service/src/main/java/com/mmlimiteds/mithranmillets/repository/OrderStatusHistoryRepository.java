package com.mmlimiteds.mithranmillets.repository;

import com.mmlimiteds.mithranmillets.entity.OrderStatusHistory;
import com.mmlimiteds.mithranmillets.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, Long> {
    List<OrderStatusHistory> findByOrderOrderByChangedAtAsc(Order order);
}


