package com.annotations.demo.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Service responsable de la gestion des tokens JWT (JSON Web Token)
 * Fournit des méthodes pour générer, valider et extraire les informations des tokens
 */
@Service
public class JwtService {
    /**
     * Clé secrète utilisée pour signer les tokens JWT
     * Cette clé doit être gardée secrète et ne devrait pas être en dur dans le code en production
     */
    private static final String SECRET_KEY = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    
    /**
     * Extrait le nom d'utilisateur du token JWT
     * @param token Le token JWT à analyser
     * @return Le nom d'utilisateur extrait du token
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    /**
     * Génère un token JWT pour un utilisateur sans claims supplémentaires
     * @param username Le nom d'utilisateur pour lequel générer le token
     * @return Le token JWT généré
     */
    public String generateToken(String username) {
        return generateToken(new HashMap<>(), username);
    }
    
    /**
     * Génère un token JWT pour un utilisateur avec ses détails
     * @param userDetails Les détails de l'utilisateur pour lequel générer le token
     * @return Le token JWT généré
     */
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();
        claims.put("role", authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(",")));
        
        return generateToken(claims, userDetails.getUsername());
    }
    
    /**
     * Génère un token JWT avec des claims supplémentaires
     * @param extraClaims Claims supplémentaires à inclure dans le token
     * @param username Le nom d'utilisateur pour lequel générer le token
     * @return Le token JWT généré
     */
    public String generateToken(Map<String, Object> extraClaims, String username) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 24)) // Expire après 24 heures
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }
    
    /**
     * Vérifie si un token est valide pour un utilisateur donné
     * @param token Le token à vérifier
     * @param username Le nom d'utilisateur à valider
     * @return true si le token est valide, false sinon
     */
    public boolean isTokenValid(String token, String username) {
        final String tokenUsername = extractUsername(token);
        return (tokenUsername.equals(username)) && !isTokenExpired(token);
    }
    
    /**
     * Vérifie si le token est expiré
     * @param token Le token à vérifier
     * @return true si le token est expiré, false sinon
     */
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    
    /**
     * Extrait la date d'expiration du token
     * @param token Le token dont extraire la date d'expiration
     * @return La date d'expiration du token
     */
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
    
    /**
     * Extrait une claim spécifique du token en utilisant une fonction de résolution
     * @param token Le token dont extraire la claim
     * @param claimsResolver La fonction à appliquer sur les claims
     * @return La valeur de la claim extraite
     */
    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    
    /**
     * Extrait toutes les claims du token
     * @param token Le token à parser
     * @return Les claims contenues dans le token
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
    
    /**
     * Génère la clé de signature pour les tokens JWT
     * @return La clé de signature
     */
    private Key getSignInKey() {
        byte[] keyBytes = java.util.Base64.getDecoder().decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}