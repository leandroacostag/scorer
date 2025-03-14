#!/bin/bash

# Deploy API to Heroku
echo "Deploying API to Heroku..."
git subtree push --prefix api heroku-api main

# Deploy frontend to Heroku
echo "Deploying frontend to Heroku..."
git subtree push --prefix frontend heroku-frontend main

echo "Deployment complete!" 