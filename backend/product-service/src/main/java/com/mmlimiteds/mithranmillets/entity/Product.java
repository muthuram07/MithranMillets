package com.mmlimiteds.mithranmillets.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Product name is required")
    @Size(max = 100, message = "Product name must be under 100 characters")
    @Column(nullable = false)
    private String name;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.1", inclusive = true, message = "Price must be greater than zero")
    @Column(nullable = false)
    private Double price;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "image", columnDefinition = "LONGBLOB")
    private byte[] image;

    @Size(max = 500, message = "Description must be under 500 characters")
    private String description;

    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stock;

    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category must be under 50 characters")
    private String category;

    // New field to store MIME type
    private String imageContentType;

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

	public byte[] getImage() {
		return image;
	}

	public void setImage(byte[] image) {
		this.image = image;
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

	public String getImageContentType() {
		return imageContentType;
	}

	public void setImageContentType(String imageContentType) {
		this.imageContentType = imageContentType;
	}
}
