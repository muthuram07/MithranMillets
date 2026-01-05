package com.mmlimiteds.mithranmillets.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

@FeignClient(name = "order-service", url = "http://localhost:8083")
public interface OrderClient {
    @PutMapping("/order/mark-paid/{razorpayOrderId}")
    void markOrderPaid(@PathVariable String razorpayOrderId);
}

