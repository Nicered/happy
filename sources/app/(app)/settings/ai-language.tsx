import React, { memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Item } from '@/components/Item';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { useSettingMutable } from '@/sync/storage';
import { t } from '@/text';

type AiLanguageOption = 'auto' | 'Korean' | 'English';

interface LanguageItem {
    key: AiLanguageOption;
    title: string;
    subtitle?: string;
}

export default memo(function AiLanguageSettingsScreen() {
    const [aiResponseLanguage, setAiResponseLanguage] = useSettingMutable('aiResponseLanguage');

    // Current selection
    const currentSelection: AiLanguageOption = aiResponseLanguage === null ? 'auto' :
        aiResponseLanguage === 'Korean' ? 'Korean' :
        aiResponseLanguage === 'English' ? 'English' : 'auto';

    // Language options - English and Korean prioritized
    const languageOptions: LanguageItem[] = [
        {
            key: 'auto',
            title: t('settingsAiLanguage.automatic'),
            subtitle: t('settingsAiLanguage.automaticSubtitle')
        },
        {
            key: 'Korean',
            title: '한국어',
            subtitle: t('settingsAiLanguage.korean')
        },
        {
            key: 'English',
            title: 'English',
            subtitle: t('settingsAiLanguage.english')
        }
    ];

    const handleLanguageChange = (newLanguage: AiLanguageOption) => {
        if (newLanguage === currentSelection) {
            return; // No change
        }

        // Update the preference (no restart needed for AI response language)
        const newPreference = newLanguage === 'auto' ? null : newLanguage;
        setAiResponseLanguage(newPreference);
    };

    return (
        <ItemList style={{ paddingTop: 0 }}>
            <ItemGroup
                title={t('settingsAiLanguage.currentLanguage')}
                footer={t('settingsAiLanguage.description')}
            >
                {languageOptions.map((option) => (
                    <Item
                        key={option.key}
                        title={option.title}
                        subtitle={option.subtitle}
                        icon={<Ionicons
                            name="chatbubbles-outline"
                            size={29}
                            color="#007AFF"
                        />}
                        rightElement={
                            currentSelection === option.key ? (
                                <Ionicons
                                    name="checkmark"
                                    size={20}
                                    color="#007AFF"
                                />
                            ) : null
                        }
                        onPress={() => handleLanguageChange(option.key)}
                        showChevron={false}
                    />
                ))}
            </ItemGroup>
        </ItemList>
    );
});
