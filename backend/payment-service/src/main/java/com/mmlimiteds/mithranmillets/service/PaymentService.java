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

    /**
     * Creates a Razorpay order using the provided payment request and saves it to the database.
     *
     * @param request the payment request DTO
     * @return the payment response DTO with order details
     * @throws Exception if Razorpay fails
     */
    public PaymentResponseDTO createOrder(PaymentRequestDTO request) {
        try {
            RazorpayClient client = new RazorpayClient(razorpayKey, razorpaySecret);

            JSONObject options = new JSONObject();
            options.put("amount", (int)(request.getAmount() * 100));
            options.put("currency", request.getCurrency());
            options.put("receipt", request.getReceipt());
            options.put("payment_capture", 1);

            Order order = client.orders.create(options);

            Payment payment = new Payment();
            payment.setUsername(getCurrentUsername());
            payment.setRazorpayOrderId(order.get("id"));
            payment.setReceipt(order.get("receipt"));
            payment.setAmount(request.getAmount());
            payment.setCurrency(request.getCurrency());
            payment.setStatus(order.get("status"));
            payment.setCreatedAt(new Date());

            paymentRepository.save(payment);

            return new PaymentResponseDTO(
                order.get("id"),
                order.get("status"),
                order.get("receipt")
            );
        } catch (Exception e) {
            throw new PaymentInitiationException(e.getMessage());
        }
    }


    /**
     * Retrieves payment history for the authenticated user.
     *
     * @return list of payment records
     */
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
