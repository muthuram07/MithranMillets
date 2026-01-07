package com.mmlimiteds.mithranmillets.service;

import com.mmlimiteds.mithranmillets.dto.PaymentRequestDTO;
import com.mmlimiteds.mithranmillets.dto.PaymentResponseDTO;
import com.mmlimiteds.mithranmillets.entity.Payment;
import com.mmlimiteds.mithranmillets.exception.PaymentInitiationException;
import com.mmlimiteds.mithranmillets.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.apache.commons.codec.binary.Hex;

import java.util.Date;
import java.util.List;

@Service
public class PaymentService {

    @Value("${razorpay.key}")
    private String razorpayKey;

    @Value("${razorpay.secret}")
    private String razorpaySecret;

    @Autowired
    private PaymentRepository paymentRepository;

    public PaymentResponseDTO createOrder(PaymentRequestDTO request) {
        try {
            RazorpayClient client = new RazorpayClient(razorpayKey, razorpaySecret);

            JSONObject options = new JSONObject();
            // Razorpay expects amount in paise (Rupees * 100)
            options.put("amount", (int)(request.getAmount() * 100));
            options.put("currency", request.getCurrency());
            options.put("receipt", request.getReceipt());
            options.put("payment_capture", 1);

            Order order = client.orders.create(options);

            // Extract values safely as Strings
            String orderId = order.get("id").toString();
            String status = order.get("status").toString();
            String receipt = order.get("receipt") != null ? order.get("receipt").toString() : request.getReceipt();

            // Save to database
            Payment payment = new Payment();
            payment.setUsername(getCurrentUsername());
            payment.setRazorpayOrderId(orderId);
            payment.setReceipt(receipt);
            payment.setAmount(request.getAmount());
            payment.setCurrency(request.getCurrency());
            payment.setStatus(status);
            payment.setCreatedAt(new Date());

            paymentRepository.save(payment);

            // Using setters to ensure no constructor "undefined" errors occur
            PaymentResponseDTO response = new PaymentResponseDTO();
            response.setOrderId(orderId);
            response.setStatus(status);
            response.setReceipt(receipt);

            return response;

        } catch (Exception e) {
            throw new PaymentInitiationException("Razorpay Order Creation Failed: " + e.getMessage());
        }
    }

    public List<Payment> getPaymentHistory() {
        String username = getCurrentUsername();
        return paymentRepository.findByUsername(username);
    }

    private String getCurrentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
    
    public boolean verifySignature(String orderId, String paymentId, String signature) throws Exception {
        String payload = orderId + "|" + paymentId;
        Mac sha256 = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(razorpaySecret.getBytes(), "HmacSHA256");
        sha256.init(secretKey);
        byte[] hash = sha256.doFinal(payload.getBytes());
        String generatedSignature = Hex.encodeHexString(hash);
        return generatedSignature.equals(signature);
    }
}