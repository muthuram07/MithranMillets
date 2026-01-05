package com.mmlimiteds.mithranmillets.dto;
import lombok.*;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDTO {
  private Long id;
  private Long productId;
  private String productName;
  private Double price;
  private Integer quantity;
  private String imageUrl;
  public Long getId() {
	return id;
  }
  public void setId(Long id) {
	this.id = id;
  }
  public Long getProductId() {
	return productId;
  }
  public void setProductId(Long productId) {
	this.productId = productId;
  }
  public String getProductName() {
	return productName;
  }
  public void setProductName(String productName) {
	this.productName = productName;
  }
  public Double getPrice() {
	return price;
  }
  public void setPrice(Double price) {
	this.price = price;
  }
  public Integer getQuantity() {
	return quantity;
  }
  public void setQuantity(Integer quantity) {
	this.quantity = quantity;
  }
  public String getImageUrl() {
	return imageUrl;
  }
  public void setImageUrl(String imageUrl) {
	this.imageUrl = imageUrl;
  }
}
