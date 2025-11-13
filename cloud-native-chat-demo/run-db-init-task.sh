#!/bin/bash
set -e

echo "======================================"
echo "Running Database Initializer Task"
echo "======================================"
echo ""

APP_NAME="cloud-native-chat"

# Check if app exists
if ! cf app "$APP_NAME" > /dev/null 2>&1; then
    echo "Error: Application '$APP_NAME' not found"
    echo "Please deploy the application first using ./deploy-cf.sh"
    exit 1
fi

# Run the database initializer task
echo "Running task: java -jar app.jar --spring.profiles.active=initializer"
echo ""

TASK_OUTPUT=$(cf run-task "$APP_NAME" "java -jar app.jar --spring.profiles.active=initializer" --name db-initializer)
TASK_ID=$(echo "$TASK_OUTPUT" | grep "task id:" | awk '{print $3}')

echo "✓ Task started with ID: $TASK_ID"
echo ""
echo "To monitor task status:"
echo "  cf tasks $APP_NAME"
echo ""
echo "To view task logs:"
echo "  cf logs $APP_NAME --recent | grep db-initializer"
echo ""
echo "Monitoring task progress..."

# Monitor task completion
while true; do
    TASK_STATE=$(cf tasks "$APP_NAME" | grep "^$TASK_ID" | awk '{print $3}')

    if [ "$TASK_STATE" = "SUCCEEDED" ]; then
        echo "✓ Database initializer task completed successfully"
        echo ""
        echo "Task logs:"
        cf logs "$APP_NAME" --recent | grep -A 20 "db-initializer" || true
        break
    elif [ "$TASK_STATE" = "FAILED" ]; then
        echo "✗ Database initializer task failed"
        echo ""
        echo "Task logs:"
        cf logs "$APP_NAME" --recent | grep -A 20 "db-initializer" || true
        exit 1
    fi

    echo "  Task state: $TASK_STATE - waiting..."
    sleep 3
done

echo ""
echo "======================================"
echo "Task completed successfully"
echo "======================================"
