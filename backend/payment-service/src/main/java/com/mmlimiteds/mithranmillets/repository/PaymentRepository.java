package com.mmlimiteds.mithranmillets.repository;

import com.mmlimiteds.mithranmillets.entity.Payment;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Payment findByRazorpayOrderId(String razorpayOrderId);
    List<Payment> findByUsername(String username);
}

