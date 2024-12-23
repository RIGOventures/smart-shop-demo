'use client';

import { Preferences } from '@/lib/types';

import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom'
import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation'

import allergyTypes from '@/lib/registry/allergies'
import dietPlanTypes from '@/lib/registry/dietPlans'

import { getMessageFromCode } from '@/lib/utils/result'

import { getPreferences, updatePreferences } from '@/app/account/actions';

import { toast } from 'sonner'

import SubmitButton from './submit-button'

import {
	HeartIcon,
	UserCircleIcon,
} from '@heroicons/react/24/outline';

const defaultPreferences = {
	lifestyle: '', 
	allergen: '', 
	health: '', 
}

interface Props {
    profileId?: string,
	currentPreferences?: Preferences 
}

export default function EditAccountForm({ profileId, currentPreferences }: Props) {
	const router = useRouter()

	// Get current preference
	const { register, handleSubmit, reset } = useForm<Preferences>({
		defaultValues: currentPreferences || defaultPreferences,
	});

	// Augment submit aciton
	const updatePreferencesWithId = updatePreferences.bind(null, profileId!);
	const [result, formAction] = useFormState(updatePreferencesWithId, undefined);

	// Add toast to update state change
    useEffect(() => {
        if (result) {
            if (result.type === 'error') {
                toast.error(getMessageFromCode(result.resultCode))
            } else {
                toast.success(getMessageFromCode(result.resultCode))
				router.refresh()
                router.push("/")
            }
        }
    }, [result, router])

	// Get latest preference
	useEffect(() => {
        getPreferences(profileId).then((res: Preferences | null) => {
			if (res) reset(res)
			else reset(defaultPreferences)
		})
    }, [reset, profileId])

	return (
		<form action={formAction}>
			<div className="rounded-md p-4 md:p-6">

				{/* Lifestyle Name */}
				<div className="mb-4">
					<label htmlFor="customer" className="mb-2 block text-sm font-medium">
						Choose diet plan or lifestyle
					</label>
					<div className="relative">
						<select
							id="lifestyle"
							className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500 dark:border-zinc-800 dark:bg-zinc-950"
							{...register("lifestyle")}
						>
						<option value="" disabled>
							Select a lifestyle
						</option>
							{dietPlanTypes.map((lifestyle) => (
								<option key={lifestyle} value={lifestyle}>
									{lifestyle}
								</option>
							))}
						</select>
						<UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
					</div>
				</div>

				{/* Allergen Name */}
				<div className="mb-4">
					<label htmlFor="customer" className="mb-2 block text-sm font-medium">
						Choose an allergen
					</label>
					<div className="relative">
						<select
							id="allergen"
							className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500 dark:border-zinc-800 dark:bg-zinc-950"
							{...register("allergen")}
						>
						<option value="" disabled>
							Select an allergen
						</option>
							{allergyTypes.map((allergen) => (
								<option key={allergen} value={allergen}>
									{allergen}
								</option>
							))}
						</select>
						<UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
					</div>
				</div>

				{/* Health Conditions */}
				<fieldset>
					<legend className="mb-2 block text-sm font-medium">
						Are there any specific health conditions or dietary restrictions you’d like us to consider when recommending products?
					</legend>
					<div className="relative mt-2 rounded-md">
						<div className="relative">
							<input
								{...register("health")}
								id="health"
								type="text"
								placeholder="Enter dietary restriction"
								className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500 dark:border-zinc-800 dark:bg-zinc-950"
							/>
							<HeartIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
						</div>
					</div>
				</fieldset>
			</div>
			<SubmitButton label="Save" />
		</form>
	);
}
