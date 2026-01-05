package com.mmlimiteds.mithranmillets.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddressDTO {
  private Long id;
  private String name;
  private String phone;
  private String street;
  private String city;
  private String state;
  private String pincode;
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

