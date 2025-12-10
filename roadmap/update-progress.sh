#!/bin/bash

# KnowMan Roadmap Progress Updater
# Usage: ./update-progress.sh [feature] [completion_percentage]

set -e

ROADMAP_DIR="$(dirname "$0")"
FEATURE="$1"
COMPLETION="$2"

if [ -z "$FEATURE" ]; then
    echo "Usage: $0 [feature] [completion_percentage]"
    echo "Example: $0 authentication 45"
    echo ""
    echo "Available features:"
    echo "  authentication    - Authentication System"
    echo "  capture          - Capture Functionality"
    echo "  search           - Search Functionality"
    echo "  items            - Items Management"
    echo "  settings         - Settings & Preferences"
    echo "  dashboard        - Dashboard Widgets"
    echo "  tags             - Tag Management"
    exit 1
fi

case "$FEATURE" in
    authentication)
        FILE="01-authentication-system.md"
        FEATURE_NAME="Authentication System"
        ;;
    capture)
        FILE="02-capture-functionality.md"
        FEATURE_NAME="Capture Functionality"
        ;;
    search)
        FILE="03-search-functionality.md"
        FEATURE_NAME="Search Functionality"
        ;;
    items)
        FILE="04-items-management.md"
        FEATURE_NAME="Items Management"
        ;;
    settings)
        FILE="05-settings-preferences.md"
        FEATURE_NAME="Settings & Preferences"
        ;;
    dashboard)
        FILE="06-dashboard-widgets.md"
        FEATURE_NAME="Dashboard Widgets"
        ;;
    tags)
        FILE="07-tag-management.md"
        FEATURE_NAME="Tag Management"
        ;;
    *)
        echo "Unknown feature: $FEATURE"
        exit 1
        ;;
esac

FILE_PATH="$ROADMAP_DIR/$FILE"

if [ ! -f "$FILE_PATH" ]; then
    echo "Roadmap file not found: $FILE_PATH"
    exit 1
fi

# Update completion percentage if provided
if [ -n "$COMPLETION" ]; then
    # Validate completion is a number between 0-100
    if ! [[ "$COMPLETION" =~ ^[0-9]+$ ]] || [ "$COMPLETION" -lt 0 ] || [ "$COMPLETION" -gt 100 ]; then
        echo "Error: Completion percentage must be a number between 0 and 100"
        exit 1
    fi

    # Update completion in the index file
    INDEX_FILE="$ROADMAP_DIR/00-index.md"
    if [ -f "$INDEX_FILE" ]; then
        # Update the specific feature line
        sed -i "s/^\(.*$FEATURE_NAME: \)[0-9]\+%/\1${COMPLETION}%/" "$INDEX_FILE"
        echo "Updated $FEATURE_NAME completion to ${COMPLETION}% in index"
    fi
fi

# Calculate overall progress from index file
echo ""
echo "=== KnowMan Development Progress ==="
echo ""

INDEX_FILE="$ROADMAP_DIR/00-index.md"
if [ -f "$INDEX_FILE" ]; then
    TOTAL_COMPLETION=0
    FEATURE_COUNT=0

    # Extract completion percentages from index
    while read -r line; do
        if [[ "$line" =~ ^[0-9]+\.[[:space:]]+(.*):[[:space:]]+([0-9]+)% ]]; then
            FEATURE_NAME="${BASH_REMATCH[1]}"
            COMPLETION="${BASH_REMATCH[2]}"
            echo "$FEATURE_NAME: ${COMPLETION}%"
            TOTAL_COMPLETION=$((TOTAL_COMPLETION + COMPLETION))
            FEATURE_COUNT=$((FEATURE_COUNT + 1))
        fi
    done < <(grep -E "^[0-9]+\.[[:space:]]+.*:.*%" "$INDEX_FILE")

    if [ "$FEATURE_COUNT" -gt 0 ]; then
        AVERAGE=$((TOTAL_COMPLETION / FEATURE_COUNT))
        echo ""
        echo "Overall Progress: ${AVERAGE}%"
        echo "Features Tracked: $FEATURE_COUNT"
    fi
else
    echo "Index file not found: $INDEX_FILE"
fi

echo ""
echo "Last Updated: $(date '+%Y-%m-%d %H:%M:%S')"