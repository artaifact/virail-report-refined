#!/bin/bash

echo "🔐 Test de connexion admin et création d'abonnement Pro"
echo "=================================================="

# Variables
API_URL="http://localhost:8000"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="testpassword123"
COOKIE_FILE="admin_cookies.txt"


echo ""
echo "1️⃣ Tentative de connexion admin..."

# Connexion admin
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}" \
  -c "$COOKIE_FILE")

echo "Réponse de connexion: $LOGIN_RESPONSE"

# Vérifier si la connexion a réussi
if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "✅ Connexion admin réussie!"

    echo ""
    echo "2️⃣ Récupération des plans disponibles..."

    # Récupérer les plans
    PLANS_RESPONSE=$(curl -s "$API_URL/api/v1/plans/" -b "$COOKIE_FILE")
    echo "Plans disponibles: $PLANS_RESPONSE"

    echo ""
    echo "3️⃣ Vérification des quotas actuels..."

    # Vérifier les quotas actuels
    QUOTAS_RESPONSE=$(curl -s "$API_URL/api/v1/usage/limits" -b "$COOKIE_FILE")
    echo "Quotas actuels: $QUOTAS_RESPONSE"

    echo ""
    echo "4️⃣ Création d'un abonnement Pro..."

    # Créer un abonnement Pro (payment_method doit être un objet/dict)
    SUBSCRIPTION_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/subscriptions/" \
      -H "Content-Type: application/json" \
      -b "$COOKIE_FILE" \
      -d '{
        "plan_id": "pro",
        "auto_renew": true,
        "payment_method": {}
      }')

    echo "Réponse création abonnement: $SUBSCRIPTION_RESPONSE"

    echo ""
    echo "5️⃣ Activation de l'abonnement (simulation webhook)..."

    # Récupérer l'ID de l'abonnement créé
    SUBSCRIPTION_ID=$(echo "$SUBSCRIPTION_RESPONSE" | grep -o '"id":"[^"]*"' | head -n1 | cut -d'"' -f4)

    if [ ! -z "$SUBSCRIPTION_ID" ]; then
        echo "ID Abonnement trouvé: $SUBSCRIPTION_ID"

        # Activer l'abonnement
        ACTIVATION_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/subscriptions/$SUBSCRIPTION_ID/activate" \
          -b "$COOKIE_FILE")

        echo "Réponse activation: $ACTIVATION_RESPONSE"
    else
        echo "❌ Impossible de récupérer l'ID de l'abonnement"
    fi

    echo ""
    echo "6️⃣ Vérification des nouveaux quotas..."

    # Vérifier les nouveaux quotas
    NEW_QUOTAS_RESPONSE=$(curl -s "$API_URL/api/v1/usage/limits" -b "$COOKIE_FILE")
    echo "Nouveaux quotas: $NEW_QUOTAS_RESPONSE"

    echo ""
    echo "7️⃣ Test d'une fonctionnalité Pro (analyse de concurrents)..."

    # Tester une fonctionnalité Pro (url requise par l'API)
    ANALYSIS_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/competitors/analyze" \
      -H "Content-Type: application/json" \
      -b "$COOKIE_FILE" \
      -d '{
        "url": "https://example.com",
        "min_score": 0.3,
        "min_mentions": 1,
        "include_raw": false
      }')

    echo "Réponse analyse: $ANALYSIS_RESPONSE"

else
    echo "❌ Échec de la connexion admin"
    echo "Tentative de création du compte admin..."

    # Créer le compte admin s'il n'existe pas
    REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
      -H "Content-Type: application/json" \
      -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\",\"email\":\"admin@virail.com\"}" \
      -c "$COOKIE_FILE")

    echo "Réponse création compte: $REGISTER_RESPONSE"

    if echo "$REGISTER_RESPONSE" | grep -q "access_token"; then
        echo "✅ Compte admin créé avec succès!"
        echo "Relancez le script pour continuer..."
    else
        echo "❌ Impossible de créer le compte admin"
    fi
fi


echo ""
echo "🎯 Test terminé!"
echo "Cookies sauvegardés dans: $COOKIE_FILE"
