'use client'

import { Message } from '@/lib/types'

import * as React from 'react'

import { ButtonScrollToBottom } from '@/components/ui/icons'
import { PromptForm } from './chat-form'

export interface ChatPanelProps {
    input: string
    setInput: (value: string) => void
    append: (message: string, options?: {}) => Promise<string | undefined>
    setMessages: (messages: Message[] | ((messages: Message[]) => Message[])) => void
    isAtBottom: boolean
    scrollToBottom: () => void
}

export function ChatPanel({
    input,
    setInput,
    append,
    setMessages,
    isAtBottom,
    scrollToBottom
}: ChatPanelProps) {

    return (
        <div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b from-muted/30 from-0% to-muted/30 to-50% duration-300 ease-in-out animate-in dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
            <ButtonScrollToBottom
                isAtBottom={isAtBottom}
                scrollToBottom={scrollToBottom}
            />

            <div className="mx-auto sm:max-w-2xl sm:px-4">
                <div className="space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
                    <PromptForm input={input} setInput={setInput} append={append} setMessages={setMessages} />
                </div>
            </div>
        </div>
    )
}
