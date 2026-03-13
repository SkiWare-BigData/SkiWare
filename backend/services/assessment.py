from backend.models import AssessmentRequest, AssessmentResponse, Recommendation


def build_assessment_response(payload: AssessmentRequest) -> AssessmentResponse:
    recommendations: list[Recommendation] = []

    if payload.daysSinceWax >= 12:
        recommendations.append(
            Recommendation(
                title="Wax Before Your Next Session",
                severity="MEDIUM",
                description=(
                    f"Your {payload.equipmentType} have gone {payload.daysSinceWax} riding days "
                    "since the last wax. Expect slower glide and a drier base until you rewax."
                ),
            )
        )
    elif payload.daysSinceWax >= 6:
        recommendations.append(
            Recommendation(
                title="Plan a Fresh Wax Soon",
                severity="LOW",
                description=(
                    f"At {payload.daysSinceWax} riding days since waxing, performance is still okay "
                    "but you are entering the usual maintenance window."
                ),
            )
        )

    if payload.daysSinceEdgeWork >= 10:
        recommendations.append(
            Recommendation(
                title="Tune Edges for Better Hold",
                severity="MEDIUM",
                description=(
                    f"{payload.daysSinceEdgeWork} days since edge work is enough for burrs to build up, "
                    "especially if you ride hardpack or mixed conditions."
                ),
            )
        )

    if payload.coreShots >= 3:
        recommendations.append(
            Recommendation(
                title="Inspect Base Damage Closely",
                severity="HIGH",
                description=(
                    f"{payload.coreShots} visible core shots suggests meaningful base damage. Seal exposed "
                    "core material quickly and consider a full shop repair if any shot reaches the edge."
                ),
            )
        )
    elif payload.coreShots > 0:
        recommendations.append(
            Recommendation(
                title="Patch Minor Base Damage",
                severity="MEDIUM",
                description=(
                    f"You reported {payload.coreShots} visible base hits. Clean and patch them before "
                    "water or debris spreads the damage."
                ),
            )
        )

    if payload.issueDescription.strip():
        recommendations.append(
            Recommendation(
                title="Match Repair to the Reported Issue",
                severity="LOW",
                description=(
                    "Your description was captured for a deeper diagnosis. For now, check whether the "
                    "damage is cosmetic, edge-related, or structural before the next day on snow."
                ),
            )
        )

    if not recommendations:
        recommendations.append(
            Recommendation(
                title="Maintenance Looks On Track",
                severity="LOW",
                description=(
                    "Your current service intervals look healthy. Keep drying the base and edges after "
                    "each day out to avoid preventable wear."
                ),
            )
        )

    tips = [
        "Wax skis or snowboards every 5-7 riding days for consistent glide.",
        "Dry edges after each session to limit rust and hidden burrs.",
        "Inspect the base after rocky or low-snow days before the next ride.",
        "Use a storage wax coat if the gear will sit for more than a few weeks.",
        "Schedule a full tune at the start of each season or after major impacts.",
    ]

    return AssessmentResponse(
        equipmentType=payload.equipmentType,
        brand=payload.brand,
        terrain=payload.terrain,
        style=payload.style,
        daysSinceWax=payload.daysSinceWax,
        daysSinceEdgeWork=payload.daysSinceEdgeWork,
        recommendations=recommendations,
        tips=tips,
    )
