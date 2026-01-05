package com.mmlimiteds.mithranmillets.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponseDTO {
  private String orderId;
  private String status;
  private String receipt;
  public String getOrderId() {
	return orderId;
  }
  public void setOrderId(String orderId) {
	this.orderId = orderId;
  }
  public String getStatus() {
	return status;
  }
  public void setStatus(String status) {
	this.status = status;
  }
  public String getReceipt() {
	return receipt;
  }
  public void setReceipt(String receipt) {
	this.receipt = receipt;
  }
}
