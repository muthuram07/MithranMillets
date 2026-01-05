package com.mmlimiteds.mithranmillets.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Address {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  @NotBlank(message = "Username is required")
  private String username;

  @NotBlank(message = "Name is required")
  private String name;

  @NotBlank(message = "Phone number is required")
  @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid Indian phone number")
  private String phone;

  @NotBlank(message = "Street is required")
  private String street;

  @NotBlank(message = "City is required")
  private String city;

  @NotBlank(message = "State is required")
  private String state;

  @NotBlank(message = "Pincode is required")
  @Pattern(regexp = "^\\d{6}$", message = "Pincode must be 6 digits")
  private String pincode;

  public Long getId() {
	return id;
  }

  public void setId(Long id) {
	this.id = id;
  }

  public String getUsername() {
	return username;
  }

  public void setUsername(String username) {
	this.username = username;
  }

  public String getName() {
	return name;
  }

  public void setName(String name) {
	this.name = name;
  }

  public String getPhone() {
	return phone;
  }

  public void setPhone(String phone) {
	this.phone = phone;
  }

  public String getStreet() {
	return street;
  }

  public void setStreet(String street) {
	this.street = street;
  }

  public String getCity() {
	return city;
  }

  public void setCity(String city) {
	this.city = city;
  }

  public String getState() {
	return state;
  }

  public void setState(String state) {
	this.state = state;
  }

  public String getPincode() {
	return pincode;
  }

  public void setPincode(String pincode) {
	this.pincode = pincode;
  }
}
