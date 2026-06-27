package com.mmlimiteds.mithranmillets.controller;

import com.mmlimiteds.mithranmillets.dto.PaymentRequestDTO;
import com.mmlimiteds.mithranmillets.dto.PaymentResponseDTO;
import com.mmlimiteds.mithranmillets.entity.Payment;
import com.mmlimiteds.mithranmillets.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for handling payment operations.
 * Integrates with Razorpay to initiate payment orders and view payment history.
 */
@RestController
@RequestMapping("/payment")
public class PaymentController {

    @Autowired
    private PaymentService service;

    /**
     * Initiates a Razorpay payment order.
     *
     * @param request the payment request DTO
     * @return the Razorpay order response
     */
    @PostMapping("/initiate")
    public ResponseEntity<?> initiate(@Valid @RequestBody PaymentRequestDTO request) {
        PaymentResponseDTO response = service.createOrder(request);
        return ResponseEntity.ok(response);
    }


    /**
     * Retrieves payment history for the authenticated user.
     *
     * @return list of payment records
     */
    @GetMapping("/history")
    public ResponseEntity<List<Payment>> getPaymentHistory() {
        List<Payment> history = service.getPaymentHistory();
        return ResponseEntity.ok(history);
    }
    
    @PostMapping("/verify")
    public ResponseEntity<String> verifyPayment(@RequestBody Map<String, String> payload) {
        try {
            boolean isValid = service.verifySignature(
                payload.get("razorpay_order_id"),
                payload.get("razorpay_payment_id"),
                payload.get("razorpay_signature")
            );
            if (isValid) {
                return ResponseEntity.ok("Payment verified");
            } else {
                return ResponseEntity.status(400).body("Invalid signature");
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Verification failed: " + e.getMessage());
        }
    }

}
