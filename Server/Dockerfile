FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["EMR.Server.csproj", "."]
RUN dotnet restore "EMR.Server.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "EMR.Server.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "EMR.Server.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "EMR.Server.dll"]