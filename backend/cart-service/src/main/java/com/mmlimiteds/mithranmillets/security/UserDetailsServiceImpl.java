package com.mmlimiteds.mithranmillets.security;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import com.mmlimiteds.mithranmillets.client.UserFeignClient;
import com.mmlimiteds.mithranmillets.dto.UserDto;

@Component
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserFeignClient userFeignClient;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserDto user = userFeignClient.getUserByUsername(username).getBody();

        if (user == null) {
            throw new UsernameNotFoundException("User not found: " + username);
        }

        return new org.springframework.security.core.userdetails.User(
            user.getUsername(),
            "", // password not needed here
            List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
        );
    }
}

