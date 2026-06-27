package com.mmlimiteds.mithranmillets.client;

import com.mmlimiteds.mithranmillets.dto.PaymentRequestDTO;
import com.mmlimiteds.mithranmillets.dto.PaymentResponseDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.mmlimiteds.mithranmillets.config.FeignConfig;

@FeignClient(name = "payment-service", url = "${PAYMENT_SERVICE_URL:http://localhost:8084}", configuration = FeignConfig.class)
public interface PaymentClient {

    @PostMapping("/payment/initiate")
    PaymentResponseDTO initiatePayment(@RequestBody PaymentRequestDTO request);
}
