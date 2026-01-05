package com.mmlimiteds.mithranmillets.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Slf4j
public class OrderExceptionAspect {

    @AfterThrowing(pointcut = "execution(* com.mmlimiteds.mithranmillets.service.OrderService.*(..))", throwing = "ex")
    public void logServiceException(JoinPoint joinPoint, Throwable ex) {
       /// log.error("❌ Exception in OrderService.{}(): {}", joinPoint.getSignature().getName(), ex.getMessage(), ex);
    }

    @AfterThrowing(pointcut = "execution(* com.mmlimiteds.mithranmillets.controller.OrderController.*(..))", throwing = "ex")
    public void logControllerException(JoinPoint joinPoint, Throwable ex) {
        ///log.error("❌ Exception in OrderController.{}(): {}", joinPoint.getSignature().getName(), ex.getMessage(), ex);
    }
}
