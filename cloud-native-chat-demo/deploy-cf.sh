#!/bin/bash
set -e

echo "======================================"
echo "Deploying Cloud Native Chat to Cloud Foundry"
echo "======================================"
echo ""

APP_NAME="cloud-native-chat"
JAR_FILE="target/cloud-native-chat-demo-1.0.0.jar"

# Step 1: Verify JAR file exists
echo "Step 1: Verifying build..."
if [ ! -f "$JAR_FILE" ]; then
    echo "Error: JAR file not found. Please run 'mvn package' first."
    exit 1
fi
echo "✓ JAR file found: $JAR_FILE"
echo ""

# Step 2: Create services
echo "Step 2: Creating Cloud Foundry services..."
./create-services.sh
echo ""

# Step 3: Push application (without starting)
echo "Step 3: Pushing application (without starting)..."
cf push "$APP_NAME" --no-start -f manifest.yml
echo "✓ Application pushed"
echo ""

# Step 4: Ensure services are bound
echo "Step 4: Binding services..."
cf bind-service "$APP_NAME" demodb
cf bind-service "$APP_NAME" chatqueue
echo "✓ Services bound"
echo ""

# Step 5: Run database initializer task (12-Factor: Admin Process)
echo "Step 5: Running database initializer task..."
echo "This demonstrates Factor XII: Admin/management tasks as one-off processes"
echo ""

echo "Task command: java -jar app.jar --spring.profiles.active=initializer"
echo ""

TASK_OUTPUT=$(cf run-task "$APP_NAME" "java -jar app.jar --spring.profiles.active=initializer" --name db-initializer)
TASK_ID=$(echo "$TASK_OUTPUT" | grep "task id:" | awk '{print $3}')

echo "✓ Database initializer task started with ID: $TASK_ID"
echo "Waiting for task to complete..."

# Wait for task to complete
MAX_WAIT=120  # 2 minutes
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
    TASK_STATE=$(cf tasks "$APP_NAME" | grep "^$TASK_ID" | awk '{print $3}')

    if [ "$TASK_STATE" = "SUCCEEDED" ]; then
        echo "✓ Database initializer task completed successfully"
        echo ""
        echo "Task logs:"
        cf logs "$APP_NAME" --recent | grep "db-initializer" || true
        echo ""
        break
    elif [ "$TASK_STATE" = "FAILED" ]; then
        echo "✗ Database initializer task failed"
        echo ""
        echo "Task logs:"
        cf logs "$APP_NAME" --recent | grep "db-initializer" || true
        echo ""
        exit 1
    fi

    echo "  Task state: $TASK_STATE - waiting... (${ELAPSED}s elapsed)"
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo "✗ Task did not complete within $MAX_WAIT seconds"
    exit 1
fi

# Step 6: Start the application
echo "Step 6: Starting application..."
cf start "$APP_NAME"
echo "✓ Application started"
echo ""

# Step 7: Show application info
echo "======================================"
echo "Deployment Complete!"
echo "======================================"
echo ""
cf app "$APP_NAME"
echo ""
echo "Application URL:"
cf app "$APP_NAME" | grep "routes:" | awk '{print "  https://" $2}'
echo ""
echo "To view logs:"
echo "  cf logs $APP_NAME --recent"
echo ""
echo "To view tasks:"
echo "  cf tasks $APP_NAME"
