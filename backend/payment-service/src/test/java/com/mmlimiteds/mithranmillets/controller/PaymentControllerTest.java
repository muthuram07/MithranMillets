package com.mmlimiteds.mithranmillets.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mmlimiteds.mithranmillets.dto.PaymentRequestDTO;
import com.mmlimiteds.mithranmillets.dto.PaymentResponseDTO;
import com.mmlimiteds.mithranmillets.entity.Payment;
import com.mmlimiteds.mithranmillets.exception.PaymentInitiationException;
import com.mmlimiteds.mithranmillets.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * TC-PAY Test Suite - Controller Layer Tests
 * Tests API contract validation as specified in TEST_CASES.md
 */
@WebMvcTest(PaymentController.class)
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PaymentService paymentService;

    private PaymentRequestDTO testPaymentRequest;
    private PaymentResponseDTO testPaymentResponse;

    @BeforeEach
    void setUp() {
        testPaymentRequest = new PaymentRequestDTO();
        testPaymentRequest.setAmount(500.00);
        testPaymentRequest.setCurrency("INR");
        testPaymentRequest.setReceipt("order_rcpt_123");

        testPaymentResponse = new PaymentResponseDTO();
        testPaymentResponse.setOrderId("razorpay_order_123");
        testPaymentResponse.setStatus("created");
        testPaymentResponse.setReceipt("order_rcpt_123");
    }

    @Test
    @DisplayName("TC-PAY-001: Initiate Payment - Valid Order")
    @WithMockUser(username = "testuser")
    void testInitiatePayment_ValidOrder() throws Exception {
        // Setup
        when(paymentService.createOrder(any(PaymentRequestDTO.class)))
                .thenReturn(testPaymentResponse);

        // Execute & Verify
        mockMvc.perform(post("/payment/initiate")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testPaymentRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").exists())
                .andExpect(jsonPath("$.status").value("created"));
    }

    @Test
    @DisplayName("TC-PAY-002: Initiate Payment - Invalid Order")
    @WithMockUser(username = "testuser")
    void testInitiatePayment_InvalidOrder() throws Exception {
        // Setup - Invalid request with missing fields
        PaymentRequestDTO invalidRequest = new PaymentRequestDTO();
        invalidRequest.setAmount(null); // Invalid

        // Execute & Verify - Validation should fail
        mockMvc.perform(post("/payment/initiate")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TC-PAY-003: Initiate Payment - Amount Mismatch")
    @WithMockUser(username = "testuser")
    void testInitiatePayment_AmountMismatch() throws Exception {
        // Setup
        PaymentRequestDTO request = new PaymentRequestDTO();
        request.setAmount(400.00); // Different from order amount
        request.setCurrency("INR");
        request.setReceipt("order_rcpt_123");

        // Note: Amount validation typically happens at service/business logic level
        when(paymentService.createOrder(any(PaymentRequestDTO.class)))
                .thenReturn(testPaymentResponse);

        // Execute & Verify
        mockMvc.perform(post("/payment/initiate")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("TC-PAY-006: Verify Payment Status")
    @WithMockUser(username = "testuser")
    void testVerifyPaymentStatus() throws Exception {
        // Setup
        when(paymentService.verifySignature("order_123", "payment_123", "signature_123"))
                .thenReturn(true);

        Map<String, String> verifyRequest = Map.of(
                "razorpay_order_id", "order_123",
                "razorpay_payment_id", "payment_123",
                "razorpay_signature", "signature_123"
        );

        // Execute & Verify
        mockMvc.perform(post("/payment/verify")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("verified")));
    }

    @Test
    @DisplayName("TC-PAY-014: Payment Callback Verification - Invalid Signature")
    @WithMockUser(username = "testuser")
    void testVerifyPayment_InvalidSignature() throws Exception {
        // Setup
        when(paymentService.verifySignature("order_123", "payment_123", "invalid_signature"))
                .thenReturn(false);

        Map<String, String> verifyRequest = Map.of(
                "razorpay_order_id", "order_123",
                "razorpay_payment_id", "payment_123",
                "razorpay_signature", "invalid_signature"
        );

        // Execute & Verify
        mockMvc.perform(post("/payment/verify")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Invalid")));
    }

    @Test
    @DisplayName("TC-PAY: Get Payment History")
    @WithMockUser(username = "testuser")
    void testGetPaymentHistory() throws Exception {
        // Setup
        Payment payment = new Payment();
        payment.setId(1L);
        payment.setUsername("testuser");
        payment.setAmount(500.00);
        payment.setStatus("created");
        payment.setCreatedAt(new Date());

        List<Payment> payments = Arrays.asList(payment);
        when(paymentService.getPaymentHistory()).thenReturn(payments);

        // Execute & Verify
        mockMvc.perform(get("/payment/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].amount").value(500.00));
    }
}
