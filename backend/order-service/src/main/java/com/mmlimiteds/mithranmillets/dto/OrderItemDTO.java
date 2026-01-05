package com.mmlimiteds.mithranmillets.dto;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDTO {
    private Long productId;
    private String name;
    private Integer quantity;
    private Double unitPrice;
    private String imageUrl;
}

