package com.mmlimiteds.mithranmillets.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductStockUpdateDTO {
    private Long productId;
    private Integer quantity; // quantity to reduce
	public Long getProductId() {
		return productId;
	}
	public void setProductId(Long productId) {
		this.productId = productId;
	}
	public Integer getQuantity() {
		return quantity;
	}
	public void setQuantity(Integer quantity) {
		this.quantity = quantity;
	}
}
