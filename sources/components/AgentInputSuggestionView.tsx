import * as React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/constants/Typography';
import { t } from '@/text';

interface CommandSuggestionProps {
    command: string;
    description?: string;
    namespace?: string;
    source?: 'builtin' | 'project' | 'user';
}

export const CommandSuggestion = React.memo(({ command, description, namespace, source }: CommandSuggestionProps) => {
    // Determine icon based on source
    const iconName = source === 'user' ? 'person-outline' :
                     source === 'project' ? 'folder-outline' :
                     'terminal-outline';

    return (
        <View style={styles.suggestionContainer}>
            <View style={styles.commandIconContainer}>
                <Ionicons
                    name={iconName}
                    size={14}
                    color={styles.commandIconColor.color}
                />
            </View>
            <Text
                style={[styles.commandText, { marginRight: description ? 12 : 0 }]}
                numberOfLines={1}
            >
                /{command}
            </Text>
            {description && (
                <Text
                    style={styles.descriptionText}
                    numberOfLines={1}
                >
                    {description}
                </Text>
            )}
        </View>
    );
});

interface FileMentionProps {
    fileName: string;
    filePath: string;
    fileType?: 'file' | 'folder';
}

export const FileMentionSuggestion = React.memo(({ fileName, filePath, fileType = 'file' }: FileMentionProps) => {
    return (
        <View style={styles.suggestionContainer}>
            <View style={styles.iconContainer}>
                <Ionicons
                    name={fileType === 'folder' ? 'folder' : 'document-text'}
                    size={18}
                    color={styles.iconColor.color}
                />
            </View>
            <Text 
                style={styles.fileNameText}
                numberOfLines={1}
            >
                {filePath}{fileName}
            </Text>
            <Text style={styles.labelText}>
                {fileType === 'folder' ? t('agentInput.suggestion.folderLabel') : t('agentInput.suggestion.fileLabel')}
            </Text>
        </View>
    );
});

const styles = StyleSheet.create((theme) => ({
    suggestionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        height: 48,
    },
    commandIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.surfaceHigh,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    commandIconColor: {
        color: theme.colors.textSecondary,
    },
    commandText: {
        fontSize: 14,
        color: theme.colors.text,
        fontWeight: '600',
        ...Typography.default('semiBold'),
    },
    descriptionText: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.textSecondary,
        ...Typography.default(),
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.surfaceHigh,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    iconColor: {
        color: theme.colors.textSecondary,
    },
    fileNameText: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.textSecondary,
        ...Typography.default(),
    },
    labelText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginLeft: 8,
        ...Typography.default(),
    },
}));
