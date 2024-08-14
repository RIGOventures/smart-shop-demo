'use server'

import { ResultCode } from '@/lib/utils'
import type { AI, AIState } from '@/lib/actions'

import { headers } from 'next/headers'
import { openai } from '@ai-sdk/openai'
import {
    getMutableAIState,
    streamUI,
    createStreamableValue
} from 'ai/rsc'
import { rateLimit } from '@/app/(list)/actions'
import { nanoid } from '@/lib/utils'

import { BotMessage, SpinnerMessage } from '@/components/chat/message'

// Create openai model
const model = openai('gpt-4-turbo');

// Design model prompt
const prompt = `\
    You are a grocery shopping conversation bot and you help recommend users to buy certain groceries.
    You and the user can discuss reasons to buy certain groceries, in the UI.
    
    If the user wants to buy groceries, or complete another impossible task, respond that you are a demo and cannot do that.
    
    Besides that, you cannot interact with the user.
    Thank you for your help! It's greatly appreciated.`


function createUserMessage(
	groceryType: string, 
	selectedCategories: string | null, 
	specificDescriptors: string | null
) {
	let fullSearchCriteria = `Give me a list of 5 ${groceryType} recommendations ${
			selectedCategories ? `that fit all of the following categories: ${selectedCategories}` : ''
		}. ${
			specificDescriptors
				? `Make sure it fits the following description as well: ${specificDescriptors}.`
				: ''
		} ${
			selectedCategories || specificDescriptors
				? `If you do not have 5 recommendations that fit these criteria perfectly, do your best to suggest other ${groceryType}'s that I might like.`
				: ''
		}
        
        Please return this response as a numbered list with the ${groceryType}'s name, followed by a colon, and then a brief reason for picking that ${groceryType}. 
        There should be a line of whitespace between each item in the list.`;
		
	return fullSearchCriteria
}

export async function submitUserMessage(content: string) {
    
	try {
        // Get header
        const headersList = headers()
        
        // Get user ip
        const userIP =
            headersList.get('x-forwarded-for') || headersList.get('cf-connecting-ip') || '';

        // Apply rate limit middleware
        const rateLimitResult = await rateLimit(userIP);
        if (rateLimitResult) {
            console.log(rateLimitResult)
            //return rateLimitResult;
        }
    } catch (error) {

        let message
        if (error instanceof Error) message = error.message
        else message = String(error)

		return {
            type: 'error',
            resultCode: ResultCode.UnknownError,
            message: message
        }
	}

    // Create message
	const value = createUserMessage(content, null, null)
    //console.log(value)

    // Get current ai state
    const aiState = getMutableAIState<typeof AI>()

    // Update ai state with the new message
    aiState.update({
        ...aiState.get(),
        messages: [
            ...aiState.get().messages,
            {
                id: nanoid(),
                role: 'user',
                content
            }
        ]
    })

    // Create stream elements
    let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
    let textNode: undefined | React.ReactNode

    // Query model
    const result = await streamUI({
        model: model,
        initial: <SpinnerMessage />,
        system: prompt,
        messages: [
            ...aiState.get().messages.map((message: any) => ({
                role: message.role,
                content: message.content
            }))
        ],
        text: ({ content, done, delta }) => {
            // Create text stream
            if (!textStream) {
                textStream = createStreamableValue('')
                textNode = <BotMessage content={textStream.value} />
            }
    
            if (done) {
                textStream.done()

                // Update ai with the new message
                aiState.done(
                    {
                        ...aiState.get(),
                        messages: [
                            ...aiState.get().messages,
                            {
                                id: nanoid(),
                                role: 'assistant',
                                content
                            }
                        ]
                    }
                )

            } else {
                // Gradually get text stream from open ai (typing effect)
                textStream.update(delta)
            }
    
            return textNode
        }
    })

    return {
        id: nanoid(),
        display: result.value
    }
}
  