package com.mmlimiteds.mithranmillets.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {

    private Long id;

    @NotBlank(message = "Product name is required")
    @Size(max = 100, message = "Product name must be under 100 characters")
    private String name;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.1", inclusive = true, message = "Price must be greater than zero")
    private Double price;

    // imageUrl removed. Expose a read-only flag and optional URL hint for downloads
    private Boolean hasImage;
    private String imageDownloadUrl;

    @Size(max = 500, message = "Description must be under 500 characters")
    private String description;

    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stock;

    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category must be under 50 characters")
    private String category;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public Double getPrice() {
		return price;
	}

	public void setPrice(Double price) {
		this.price = price;
	}

	public Boolean getHasImage() {
		return hasImage;
	}

	public void setHasImage(Boolean hasImage) {
		this.hasImage = hasImage;
	}

	public String getImageDownloadUrl() {
		return imageDownloadUrl;
	}

	public void setImageDownloadUrl(String imageDownloadUrl) {
		this.imageDownloadUrl = imageDownloadUrl;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public Integer getStock() {
		return stock;
	}

	public void setStock(Integer stock) {
		this.stock = stock;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}
}
