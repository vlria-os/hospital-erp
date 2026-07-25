package com.example.demo.chat.interceptor;

import com.example.demo.security.jwtutil.CustomJWTException;
import com.example.demo.security.jwtutil.JWTUtil;
import com.example.demo.security.security.CustomUserDetails;
import com.example.demo.security.security.CustomUserDetailsService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {
    private final JWTUtil jwtUtil;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor=
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null){
            return message;
        }

        System.out.println("command ==> " + accessor.getCommand());

        try {
            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                List<String> authorizationHeaders = accessor.getNativeHeader("Authorization");
//                System.out.println("Authorization ==> " + authorizationHeaders);

                if (authorizationHeaders == null || authorizationHeaders.isEmpty()) {
                    throw new CustomJWTException("WEBSOCKET_TOKEN_IS_NULL");
                }

                String header = authorizationHeaders.get(0);

                if (header == null || !header.startsWith("Bearer ")) {
                    throw new CustomJWTException("WEBSOCKET_AUTHORIZATION_HEADER_FORMAT_IS_NOT_CORRECT");
                }

                String accessToken = header.substring(7);
//                System.out.println("accessToken ==> " + accessToken);

                Claims claims = jwtUtil.validateToken(accessToken);
//                System.out.println("claims subject ==> " + claims.getSubject());

                String email = claims.getSubject();

                CustomUserDetails details =
                        (CustomUserDetails) customUserDetailsService.loadUserByUsername(email);

//                System.out.println("details ==> " + details);
//                System.out.println("details userId ==> " + details.getUserId());
//                System.out.println("details authorities ==> " + details.getAuthorities());

                UsernamePasswordAuthenticationToken authenticationToken =
                        new UsernamePasswordAuthenticationToken(
                                details,
                                null,
                                details.getAuthorities()
                        ){
                            @Override
                            public String getName(){
                                return String.valueOf(details.getUserId());
                            }
                        };

                accessor.setUser(authenticationToken);

                System.out.println("CONNECT user ==> " + accessor.getUser());
            }

//            if (StompCommand.SEND.equals(accessor.getCommand())) {
//                System.out.println("SEND user ==> " + accessor.getUser());
//                System.out.println("destination ==> " + accessor.getDestination());
//            }

        } catch (Exception e) {
            System.out.println("WEBSOCKET INTERCEPTOR ERROR ==> " + e.getMessage());
            e.printStackTrace();
            throw e;
        }

        return message;
    }
}
