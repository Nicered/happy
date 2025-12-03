import React, { useEffect, useRef } from 'react';
import { useConversation } from '@elevenlabs/react-native';
import { registerVoiceSession } from './RealtimeSession';
import { storage } from '@/sync/storage';
import { realtimeClientTools } from './realtimeClientTools';
import { getElevenLabsCodeFromPreference } from '@/constants/Languages';
import type { VoiceSession, VoiceSessionConfig } from './types';

// Static reference to the conversation hook instance
let conversationInstance: ReturnType<typeof useConversation> | null = null;

// Global voice session implementation
class RealtimeVoiceSessionImpl implements VoiceSession {
    
    async startSession(config: VoiceSessionConfig): Promise<void> {
        if (!conversationInstance) {
            console.warn('Realtime voice session not initialized');
            return;
        }

        try {
            storage.getState().setRealtimeStatus('connecting');
            
            // Get user's preferred language for voice assistant
            const userLanguagePreference = storage.getState().settings.voiceAssistantLanguage;
            const elevenLabsLanguage = getElevenLabsCodeFromPreference(userLanguagePreference);
            
            // Use hardcoded agent ID for Eleven Labs
            await conversationInstance.startSession({
                agentId: __DEV__ ? 'agent_7801k2c0r5hjfraa1kdbytpvs6yt' : 'agent_6701k211syvvegba4kt7m68nxjmw',
                // Pass session ID and initial context as dynamic variables
                dynamicVariables: {
                    sessionId: config.sessionId,
                    initialConversationContext: config.initialContext || ''
                },
                overrides: {
                    agent: {
                        language: elevenLabsLanguage
                    }
                }
            });
        } catch (error) {
            console.error('Failed to start realtime session:', error);
            storage.getState().setRealtimeStatus('error');
        }
    }

    async endSession(): Promise<void> {
        if (!conversationInstance) {
            return;
        }

        try {
            await conversationInstance.endSession();
            storage.getState().setRealtimeStatus('disconnected');
        } catch (error) {
            console.error('Failed to end realtime session:', error);
        }
    }

    sendTextMessage(message: string): void {
        if (!conversationInstance) {
            console.warn('Realtime voice session not initialized');
            return;
        }

        try {
            conversationInstance.sendUserMessage(message);
        } catch (error) {
            console.error('Failed to send text message:', error);
        }
    }

    sendContextualUpdate(update: string): void {
        if (!conversationInstance) {
            console.warn('Realtime voice session not initialized');
            return;
        }

        try {
            conversationInstance.sendContextualUpdate(update);
        } catch (error) {
            console.error('Failed to send contextual update:', error);
        }
    }
}

export const RealtimeVoiceSession: React.FC = () => {
    const conversation = useConversation({
        clientTools: realtimeClientTools,
        onConnect: (data) => {
            if (__DEV__) console.log('🎤 [Voice] Connected:', data);
            storage.getState().setRealtimeStatus('connected');
        },
        onDisconnect: () => {
            if (__DEV__) console.log('🎤 [Voice] Disconnected');
            storage.getState().setRealtimeStatus('disconnected');
        },
        onMessage: (data) => {
            // Message callback - ElevenLabs SDK handles audio playback internally
            // Log in dev mode for debugging voice issues (#235, #241)
            if (__DEV__) console.log('🎤 [Voice] Message:', JSON.stringify(data).substring(0, 200));
        },
        onError: (error) => {
            // Always log errors for debugging voice issues
            console.error('🎤 [Voice] Error:', error);
            storage.getState().setRealtimeStatus('error');
        },
        onStatusChange: (data) => {
            // Status: listening, speaking, thinking - useful for debugging #235
            if (__DEV__) console.log('🎤 [Voice] Status:', data);
        },
        onModeChange: (data) => {
            // Mode changes between user speaking and agent speaking
            if (__DEV__) console.log('🎤 [Voice] Mode:', data);
        },
        onDebug: (message) => {
            if (__DEV__) console.debug('🎤 [Voice] Debug:', message);
        }
    });

    const hasRegistered = useRef(false);

    useEffect(() => {
        // Store the conversation instance globally
        conversationInstance = conversation;

        // Register the voice session once
        if (!hasRegistered.current) {
            try {
                registerVoiceSession(new RealtimeVoiceSessionImpl());
                hasRegistered.current = true;
            } catch (error) {
                console.error('Failed to register voice session:', error);
            }
        }

        return () => {
            // Clean up on unmount
            conversationInstance = null;
        };
    }, [conversation]);

    // This component doesn't render anything visible
    return null;
};