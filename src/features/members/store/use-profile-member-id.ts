import { ref, Ref, watch, onBeforeUnmount } from "vue";

export const useProfileMemberId = (): Ref<string | null> => {
    const value = ref<string | null>(null);

    if (typeof window !== "undefined") {
        const read = () => new URLSearchParams(window.location.search).get("profileMemberId");
        value.value = read();

        const onPop = () => {
            value.value = read();
        };
        window.addEventListener("popstate", onPop);

        const stop = watch(
            value,
            (newVal: string | null) => {
                const params = new URLSearchParams(window.location.search);
                if (newVal == null || newVal === "") {
                    params.delete("profileMemberId");
                } else {
                    params.set("profileMemberId", newVal);
                }
                const search = params.toString();
                const newUrl = search
                    ? `${window.location.pathname}?${search}${window.location.hash}`
                    : `${window.location.pathname}${window.location.hash}`;
                window.history.replaceState({}, "", newUrl);
            },
            { flush: "post" }
        );

        onBeforeUnmount(() => {
            window.removeEventListener("popstate", onPop);
            stop();
        });
    }

    return value;
}