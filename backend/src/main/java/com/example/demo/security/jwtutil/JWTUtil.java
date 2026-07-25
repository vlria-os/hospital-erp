package com.example.demo.security.jwtutil;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.ZonedDateTime;
import java.util.Date;
import java.util.Map;

@Component
public class JWTUtil {
    private final SecretKey key;

    public JWTUtil(@Value("${jwt.secret}") String secretKey){
        this.key= Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Map<String,Object> value, int min){
        String jwtStr= Jwts.builder()
                .header().type("JWT")
                .and()
                .subject(String.valueOf(value.get("email"))) //토큰 주인
                .claims(value) //주인 추가 정보
                .issuedAt(Date.from(ZonedDateTime.now().toInstant())) //토큰 생성된 시간
                .expiration(Date.from(ZonedDateTime.now().plusMinutes(min).toInstant())) //토큰 만료 시간
                .signWith(key)
                .compact();
        return jwtStr;
    }

    public Claims validateToken(String token){
        Claims claim=null;

        try{
            claim = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseClaimsJws(token)
                    .getPayload();
        }catch (MalformedJwtException malformedJwtException){
            System.out.println("=============>"+token);
            throw new CustomJWTException("Malformed");
        }catch (ExpiredJwtException expiredJwtException){
            throw new CustomJWTException("Expired");
        }catch (InvalidClaimException invalidClaimException){
            throw new CustomJWTException("Invalid");
        }catch (JwtException jwtException){
            throw new CustomJWTException("JWTError");
        }catch (Exception e){
            throw new CustomJWTException("Error");
        }

        return claim;
    }

    public Claims getClaimsIgnoreExpiration(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

        } catch (ExpiredJwtException e) {
            return e.getClaims();
        }
    }
}
