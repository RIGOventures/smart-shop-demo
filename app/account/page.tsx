import { Session } from '@/lib/types'

import { redirect } from 'next/navigation'
import { auth } from '@/auth'

import EditAccountForm from "@/components/account-form";
import { deauthenticate, getUser } from '../login/actions';
import { useEffect } from 'react';

const dietPlanTypes = [
    'Vegan',
    'Ketogenic',
    'Low-carb',
    'Mediterranean'
];

const allergyTypes = [
    'Nuts',
    'Dairy'
];

export default async function Page() {
    const session = (await auth()) as Session
    if (!session?.user) {
        redirect(`/`)
    }

    const user = await getUser(session.user.email) // Get user

    return (
        <div
            className="group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]"
            >
            <div className="fixed inset-x-0 w-full from-muted/30 from-0% to-muted/30 to-50% duration-300 ease-in-out animate-in dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
                <p className="space-y-4 border-t bg-background px-4 py-2 sm:rounded-t-xl sm:border md:py-4">
                    <EditAccountForm user={user!} lifestyles={dietPlanTypes} allergens={allergyTypes} />
                </p>
            </div>
        </div>
    )
}