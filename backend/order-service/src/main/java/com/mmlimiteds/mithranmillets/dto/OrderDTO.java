package com.mmlimiteds.mithranmillets.dto;

import java.sql.Date;
import java.util.List;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {
    private String username;
    private Long id;
    private Double totalAmount;
    private String paymentMethod;
    private String status;
    private Date orderDate;
    private AddressDTO address;
    private String razorpayOrderId;
    private String paymentStatus;

    // ✅ Add this field
    private List<OrderItemDTO> items;
}
